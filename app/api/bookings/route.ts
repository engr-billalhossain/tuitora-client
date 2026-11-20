import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getDb, idFilter } from "@/lib/mongodb";
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

/** All slot-level bookings, used to compute per-slot availability everywhere. */
export async function GET() {
  try {
    const docs = await (await getBookingCollection())
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const bookings = docs.map((doc) => ({
      id: String(doc._id),
      tuitionId: String(doc.tuitionId),
      slotId: String(doc.slotId),
      slotLabel: String(doc.slotLabel ?? slotLabel(String(doc.slotId))),
      studentId: String(doc.studentId ?? ""),
      studentName: String(doc.studentName ?? ""),
      studentEmail: String(doc.studentEmail ?? ""),
      createdAt: String(doc.createdAt ?? ""),
    }));

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

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const tuitionId = String(body.tuitionId ?? "").trim();
    const slotId = body.slotId;
    if (!tuitionId || !isSlotId(slotId)) {
      return NextResponse.json(
        { error: "A valid tuition and time slot are required" },
        { status: 400 }
      );
    }

    const collection = await getBookingCollection();
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
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to save booking:", error);
    return NextResponse.json({ error: "Failed to save booking" }, { status: 500 });
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
