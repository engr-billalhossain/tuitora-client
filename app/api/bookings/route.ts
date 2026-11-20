import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import type { Tuition } from "@/lib/actions/postTuitions";
import {
  FREE_APPLICATION_LIMIT,
  PLAN_LIMIT_REACHED,
} from "@/lib/plan-limits";
import { getDb, idFilter } from "@/lib/mongodb";
import { isUserPro } from "@/lib/pro";
import { isSlotId, normalizeSlots, slotLabel } from "@/lib/slots";
import {
  getTuitionCollection,
  serializeTuition,
} from "@/lib/tuitionDb";

export const dynamic = "force-dynamic";

async function getBookingCollection() {
  const db = await getDb();
  return db.collection("bookings");
}

async function isTutor(user: { id: string; role?: string }) {
  return user.role === "tutor" || user.role === "teacher";
}

/** Tuition ids owned by a tutor (string id, email or legacy name). */
async function tutorTuitions(user: { id: string; email?: string | null; name?: string | null }) {
  const email = (user.email || "").toLowerCase();
  const name = user.name || "";
  const conditions: Record<string, unknown>[] = [{ tutorId: user.id }];
  if (email) conditions.push({ tutorEmail: email });
  if (name) conditions.push({ tutorName: name, tutorId: { $exists: false } });

  const docs = await (await getTuitionCollection()).find({ $or: conditions }).toArray();
  return docs.map(serializeTuition);
}

function bookingView(doc: Record<string, unknown>, tuition?: Tuition) {
  return {
    id: String(doc._id),
    tuitionId: String(doc.tuitionId ?? ""),
    slotId: String(doc.slotId ?? ""),
    slotLabel: String(doc.slotLabel ?? slotLabel(String(doc.slotId ?? ""))),
    studentId: String(doc.studentId ?? ""),
    studentName: String(doc.studentName ?? ""),
    studentEmail: String(doc.studentEmail ?? ""),
    status: doc.status === "enrolled" ? "enrolled" : "pending",
    tuitionTitle: tuition?.title,
    subject: tuition?.subject,
    createdAt: String(doc.createdAt ?? ""),
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
        if (!isTutor(user as { id: string; role?: string })) {
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
      bookingView(doc, tuitionById.get(String(doc.tuitionId ?? "")))
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

/** Student books one specific slot of an approved tuition. */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
    }
    const role = (user as { role?: string }).role;
    if (role && role !== "student") {
      return NextResponse.json({ error: "Only students can book" }, { status: 403 });
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
    const tuitionId = String(body.tuitionId ?? "").trim();
    const slotId = body.slotId;
    if (!tuitionId || !isSlotId(slotId)) {
      return NextResponse.json(
        { error: "A valid tuition and time slot are required" },
        { status: 400 }
      );
    }

    const alreadyBooked = await collection.findOne({ tuitionId, slotId });
    if (alreadyBooked) {
      return NextResponse.json(
        { error: "This time slot has already been booked" },
        { status: 409 }
      );
    }

    const tuitionDoc = await (await getTuitionCollection()).findOne(
      idFilter(tuitionId)
    );
    const tuition = tuitionDoc ? serializeTuition(tuitionDoc) : null;
    if (!tuition || tuition.status !== "approved") {
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

    await collection.insertOne({
      tuitionId,
      slotId,
      slotLabel: slotLabel(slotId),
      studentId: user.id,
      studentName: user.name || "",
      studentEmail: user.email || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to save booking:", error);
    return NextResponse.json({ error: "Failed to save booking" }, { status: 500 });
  }
}

/** Tutor adds an applicant to their course, which unlocks student reviews. */
export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
    }
    if (!isTutor(user as { id: string; role?: string })) {
      return NextResponse.json({ error: "Only tutors can add students" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const bookingId = String(body.bookingId ?? body.id ?? "").trim();
    if (!bookingId) {
      return NextResponse.json({ error: "A booking is required" }, { status: 400 });
    }

    const collection = await getBookingCollection();
    const booking = await collection.findOne(idFilter(bookingId));
    if (!booking) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const owned = await tutorTuitions(user);
    if (!owned.some((item) => item.id === String(booking.tuitionId ?? ""))) {
      return NextResponse.json({ error: "This application is not yours" }, { status: 403 });
    }

    await collection.updateOne(
      { _id: booking._id },
      { $set: { status: "enrolled", enrolledAt: new Date().toISOString() } }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to add student to course:", error);
    return NextResponse.json({ error: "Failed to add student to course" }, { status: 500 });
  }
}

/** Student cancels their own booking for a slot, freeing it for everyone. */
export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
    }
    const role = (user as { role?: string }).role;
    if (role && role !== "student") {
      return NextResponse.json({ error: "Only students can cancel a booking" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const tuitionId = String(body.tuitionId ?? "").trim();
    const slotId = String(body.slotId ?? "").trim();
    if (!tuitionId || !slotId) {
      return NextResponse.json(
        { error: "A valid tuition and time slot are required" },
        { status: 400 }
      );
    }

    const collection = await getBookingCollection();
    // Only the student who made the booking may remove it.
    await collection.deleteOne({ tuitionId, slotId, studentId: user.id });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
