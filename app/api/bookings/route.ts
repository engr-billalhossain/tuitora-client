import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  FREE_APPLICATION_LIMIT,
  PLAN_LIMIT_REACHED,
} from "@/lib/plan-limits";
import { getDb, idFilter } from "@/lib/mongodb";
import { isUserPro } from "@/lib/pro";
import { isSlotId, normalizeSlots, slotLabel } from "@/lib/slots";
import { getTuitionCollection, serializeTuition } from "@/lib/tuitionDb";
import type { Tuition } from "@/lib/actions/postTuitions";
import { cleanPhone, cleanText, normalizeApplicationStatus } from "@/lib/validation";

export const dynamic = "force-dynamic";

type LooseDoc = Record<string, unknown> & { _id?: unknown };

async function getBookingCollection() {
  const db = await getDb();
  return db.collection("bookings");
}

async function isTutor(user: { id: string; role?: string }) {
  return user.role === "tutor" || user.role === "teacher";
}

/** Tuition ids owned by a tutor (string id, email or legacy name). */
async function tutorTuitions(user: {
  id: string;
  email?: string | null;
  name?: string | null;
}) {
  const email = (user.email || "").toLowerCase();
  const name = user.name || "";
  const conditions: Record<string, unknown>[] = [{ tutorId: user.id }];
  if (email) conditions.push({ tutorEmail: email });
  if (name) conditions.push({ tutorName: name, tutorId: { $exists: false } });

  const docs = await (await getTuitionCollection()).find({ $or: conditions }).toArray();
  return docs.map(serializeTuition);
}

/** Full canonical view of an application, with legacy "enrolled" records normalised. */
function bookingView(doc: LooseDoc, tuition?: Tuition) {
  const status = normalizeApplicationStatus(doc.status);
  return {
    id: String(doc._id ?? ""),
    tuitionId: String(doc.tuitionId ?? ""),
    tuitionTitle: String(doc.tuitionTitle ?? tuition?.title ?? ""),
    subject: String(doc.subject ?? tuition?.subject ?? ""),
    monthlyFee: String(doc.monthlyFee ?? tuition?.monthlyFee ?? tuition?.fee ?? ""),
    tutorEmail: String(doc.tutorEmail ?? tuition?.tutorEmail ?? ""),
    slotId: String(doc.slotId ?? ""),
    slotLabel: String(doc.slotLabel ?? slotLabel(String(doc.slotId ?? ""))),
    studentId: String(doc.studentId ?? ""),
    studentName: String(doc.studentName ?? ""),
    studentEmail: String(doc.studentEmail ?? ""),
    studentPhone: String(doc.studentPhone ?? ""),
    preferredSchedule: String(doc.preferredSchedule ?? doc.slotLabel ?? ""),
    studentNote: String(doc.studentNote ?? ""),
    status,
    appliedAt: String(doc.appliedAt ?? doc.createdAt ?? ""),
    createdAt: String(doc.createdAt ?? ""),
    respondedAt: doc.respondedAt ? String(doc.respondedAt) : undefined,
  };
}

/**
 * Bookings for the browser. Public by default (slot availability), with
 * `?scope=mine` for a student and `?scope=teacher` for a tutor's applicants.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const filter: Record<string, unknown> = {};
    let tuitions: Tuition[] = [];

    if (scope === "mine" || scope === "teacher") {
      const session = await auth.api.getSession({ headers: await headers() });
      const user = session?.user;
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (scope === "mine") {
        filter.studentId = user.id;
      } else {
        if (!(await isTutor(user as { id: string; role?: string }))) {
          return NextResponse.json({ error: "Tutor access required" }, { status: 403 });
        }
        tuitions = await tutorTuitions(user);
        filter.tuitionId = { $in: tuitions.map((item) => item.id) };
      }
    }

    const docs = await (await getBookingCollection())
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const tuitionById = new Map(tuitions.map((item) => [item.id, item]));
    const bookings = docs.map((doc) =>
      bookingView(doc as LooseDoc, tuitionById.get(String(doc.tuitionId ?? "")))
    );

    return NextResponse.json({
      bookings,
      tuitionIds: bookings.map((booking) => booking.tuitionId),
    });
  } catch (error) {
    console.error("Failed to load bookings:", error);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

/** Student submits an application for one specific slot of an approved tuition. */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
    }
    const role = String((user as { role?: string }).role ?? "student").toLowerCase();
    if (role !== "student") {
      return NextResponse.json({ error: "Only students can apply" }, { status: 403 });
    }

    // Free students may apply to up to five tuitions; PRO students are
    // unlimited. Enforced here so the limit holds even if the browser skips
    // its own check.
    const collection = await getBookingCollection();
    if (!(await isUserPro(user.id))) {
      const applicationCount = await collection.countDocuments({
        studentId: user.id,
      });
      if (applicationCount >= FREE_APPLICATION_LIMIT) {
        return NextResponse.json(
          {
            error: `Free plan allows up to ${FREE_APPLICATION_LIMIT} tuition applications. Upgrade to PRO to apply without limits.`,
            code: PLAN_LIMIT_REACHED,
          },
          { status: 403 }
        );
      }
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const tuitionId = cleanText(body.tuitionId, 120);
    const slotId = body.slotId;
    if (!tuitionId || !isSlotId(slotId)) {
      return NextResponse.json(
        { error: "A valid tuition and time slot are required" },
        { status: 400 }
      );
    }

    // One active application per student per tuition. A rejected application
    // frees both the slot and the student to apply again.
    const duplicate = await collection.findOne({
      tuitionId,
      studentId: user.id,
      status: { $ne: "rejected" },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "You have already applied for this tuition" },
        { status: 409 }
      );
    }

    // A rejected application frees the slot again.
    const alreadyBooked = await collection.findOne({
      tuitionId,
      slotId,
      status: { $ne: "rejected" },
    });
    if (alreadyBooked) {
      return NextResponse.json(
        { error: "This time slot has already been booked" },
        { status: 409 }
      );
    }

    const tuitionDoc = await (await getTuitionCollection()).findOne(idFilter(tuitionId));
    const tuition = tuitionDoc ? serializeTuition(tuitionDoc) : null;
    if (!tuition || tuition.status !== "approved" || !tuition.isActive) {
      return NextResponse.json(
        { error: "This tuition is not available for booking" },
        { status: 404 }
      );
    }
    if (!normalizeSlots(tuition.slots).includes(slotId)) {
      return NextResponse.json(
        { error: "This time slot is not offered for the tuition" },
        { status: 400 }
      );
    }

    // Identity and fee come from the session/database, never from the browser.
    const storedUser = (await (await getDb())
      .collection("user")
      .findOne(idFilter(user.id), { projection: { phone: 1 } })) as LooseDoc | null;
    const now = new Date().toISOString();
    const schedule = slotLabel(slotId);

    await collection.insertOne({
      tuitionId,
      tuitionTitle: tuition.title,
      subject: tuition.subject,
      monthlyFee: tuition.monthlyFee,
      tutorEmail: tuition.tutorEmail || "",
      tutorName: tuition.tutorName || "",
      slotId,
      slotLabel: schedule,
      studentId: user.id,
      studentName: user.name || "",
      studentEmail: String(user.email || "").toLowerCase(),
      studentPhone:
        cleanPhone(body.studentPhone) || cleanPhone(storedUser?.phone),
      preferredSchedule:
        cleanText(body.preferredSchedule, 120) || schedule,
      studentNote: cleanText(body.studentNote ?? body.learningNote, 500),
      status: "pending",
      appliedAt: now,
      createdAt: now,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to save application:", error);
    return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
  }
}

/** Tutor accepts or rejects an application they own. */
export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
    }
    if (!(await isTutor(user as { id: string; role?: string }))) {
      return NextResponse.json({ error: "Only tutors can respond to applications" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const bookingId = cleanText(body.bookingId ?? body.id, 120);
    const action = String(body.action ?? "accept").toLowerCase();
    if (!bookingId) {
      return NextResponse.json({ error: "An application is required" }, { status: 400 });
    }
    if (action !== "accept" && action !== "reject") {
      return NextResponse.json(
        { error: "Action must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }
    const nextStatus = action === "accept" ? "accepted" : "rejected";

    const collection = await getBookingCollection();
    const booking = (await collection.findOne(idFilter(bookingId))) as LooseDoc | null;
    if (!booking) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const owned = await tutorTuitions(user);
    if (!owned.some((item) => item.id === String(booking.tuitionId ?? ""))) {
      return NextResponse.json({ error: "This application is not yours" }, { status: 403 });
    }

    const current = normalizeApplicationStatus(booking.status);
    if (current === nextStatus) {
      return NextResponse.json({ ok: true, status: nextStatus });
    }
    if (current !== "pending") {
      return NextResponse.json(
        { error: "This application has already been reviewed" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    await collection.updateOne(
      idFilter(String(booking._id)),
      {
        $set: {
          status: nextStatus,
          applicationStatus: nextStatus,
          respondedAt: now,
          respondedBy: user.id,
          ...(action === "accept" ? { enrolledAt: now } : {}),
        },
      }
    );

    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (error) {
    console.error("Failed to respond to application:", error);
    return NextResponse.json({ error: "Failed to respond to application" }, { status: 500 });
  }
}

/** Student cancels their own pending application, freeing the slot. */
export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
    }
    const role = String((user as { role?: string }).role ?? "student").toLowerCase();
    if (role !== "student") {
      return NextResponse.json({ error: "Only students can cancel an application" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const tuitionId = cleanText(body.tuitionId, 120);
    const slotId = cleanText(body.slotId, 40);
    if (!tuitionId || !slotId) {
      return NextResponse.json(
        { error: "A valid tuition and time slot are required" },
        { status: 400 }
      );
    }

    const collection = await getBookingCollection();
    await collection.deleteOne({ tuitionId, slotId, studentId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to cancel application:", error);
    return NextResponse.json({ error: "Failed to cancel application" }, { status: 500 });
  }
}
