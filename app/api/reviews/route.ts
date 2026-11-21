import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getDb, idFilter } from "@/lib/mongodb";
import {
  getTuitionCollection,
  serializeTuition,
} from "@/lib/tuitionDb";
import type { Tuition } from "@/lib/actions/postTuitions";

export const dynamic = "force-dynamic";

async function getReviewCollection() {
  const db = await getDb();
  return db.collection("reviews");
}

async function getBookingCollection() {
  const db = await getDb();
  return db.collection("bookings");
}

/** Stable key so reviews still group by tutor on legacy posts without tutorId. */
function tutorKey(tuition: Tuition): string {
  if (tuition.tutorId) return tuition.tutorId;
  if (tuition.tutorEmail) return `email:${tuition.tutorEmail.toLowerCase()}`;
  return `name:${tuition.tutorName || "Tutor"}`;
}

type LooseReview = Record<string, unknown> & { _id?: unknown };

function serializeReview(doc: LooseReview) {
  const rawRating = Number(doc.rating);
  const rating = Number.isFinite(rawRating)
    ? Math.min(5, Math.max(1, Math.round(rawRating)))
    : 0;

  return {
    id: String(doc._id ?? ""),
    tuitionId: String(doc.tuitionId ?? ""),
    tutorId: String(doc.tutorId ?? ""),
    tutorName: String(doc.tutorName ?? "Tutor"),
    tutorImage: doc.tutorImage ? String(doc.tutorImage) : undefined,
    subject: String(doc.subject ?? ""),
    studentId: String(doc.studentId ?? ""),
    studentName: String(doc.studentName ?? "Student"),
    studentImage: doc.studentImage ? String(doc.studentImage) : undefined,
    rating,
    comment: String(doc.comment ?? ""),
    createdAt: String(doc.createdAt ?? ""),
  };
}

/** Public feed of reviews; `?scope=mine` returns the signed-in student's reviews. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const filter: Record<string, unknown> = {};

    if (scope === "mine") {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      filter.studentId = session.user.id;
    }

    const docs = await (await getReviewCollection())
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ reviews: docs.map(serializeReview) });
  } catch (error) {
    console.error("Failed to load reviews:", error);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

/**
 * Student submits a review. Only allowed after the tutor has added the student
 * to one of the tutor's courses (an "enrolled" booking), one review per tutor.
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
    }
    const role = (user as { role?: string }).role;
    if (role && role !== "student") {
      return NextResponse.json({ error: "Only students can review tutors" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const tuitionId = String(body.tuitionId ?? "").trim();
    const rating = Number(body.rating);
    const comment = String(body.comment ?? "").trim();

    if (!tuitionId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Choose a rating between 1 and 5 stars" },
        { status: 400 }
      );
    }
    if (comment.length < 3 || comment.length > 500) {
      return NextResponse.json(
        { error: "Write a short review (3–500 characters)" },
        { status: 400 }
      );
    }

    // The tutor must have added this student to the course first.
    const enrolled = await (await getBookingCollection()).findOne({
      tuitionId,
      studentId: user.id,
      status: { $in: ["enrolled", "accepted"] },
    });
    if (!enrolled) {
      return NextResponse.json(
        { error: "You can review a tutor only after they add you to their course" },
        { status: 403 }
      );
    }

    const tuitionDoc = await (await getTuitionCollection()).findOne(idFilter(tuitionId));
    const tuition = tuitionDoc ? serializeTuition(tuitionDoc) : null;
    if (!tuition || tuition.status !== "approved") {
      return NextResponse.json({ error: "This tuition is not available" }, { status: 404 });
    }

    const key = tutorKey(tuition);
    const collection = await getReviewCollection();
    const existing = await collection.findOne({ studentId: user.id, tutorId: key });
    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this tutor" },
        { status: 409 }
      );
    }

    const doc = {
      tuitionId,
      tutorId: key,
      tutorName: tuition.tutorName || "Tutor",
      tutorImage: tuition.tutorImage || "",
      subject: tuition.subject || "",
      studentId: user.id,
      studentName: user.name || "Student",
      studentImage: user.image || "",
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    const result = await collection.insertOne(doc);

    return NextResponse.json(
      { review: serializeReview({ _id: result.insertedId, ...doc }) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save review:", error);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}
