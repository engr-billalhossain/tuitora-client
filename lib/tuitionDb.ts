import type { Tuition, TuitionStatus } from "@/lib/actions/postTuitions";
import { getDb } from "@/lib/mongodb";
import { normalizeSlots } from "@/lib/slots";
import { safeImageUrl } from "@/lib/utils";

/** Same collection the existing backend uses, so old posts stay visible. */
export const TUITION_COLLECTION = "courses";

export async function getTuitionCollection() {
  const db = await getDb();
  return db.collection(TUITION_COLLECTION);
}

export function normalizeStatus(value: unknown): TuitionStatus {
  const status = String(value ?? "pending").toLowerCase();
  if (status === "approved" || status === "published") return "approved";
  if (status === "declined" || status === "rejected") return "declined";
  return "pending";
}

type LooseDoc = Record<string, unknown> & { _id?: unknown };

function asString(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

/** Converts a raw Mongo document into the shape the UI consumes. */
export function serializeTuition(doc: LooseDoc): Tuition {
  const rating = doc.rating;
  const reviews = doc.reviews;

  return {
    id: asString(doc._id),
    title: asString(doc.title) || "Untitled tuition",
    subject: asString(doc.subject),
    classLevel: asString(doc.classLevel),
    mode: asString(doc.mode),
    fee: asString(doc.fee),
    days: asString(doc.days),
    bannerName: asString(doc.bannerName),
    bannerUrl: safeImageUrl(doc.bannerUrl) || undefined,
    description: asString(doc.description),
    slots: normalizeSlots(doc.slots),
    status: normalizeStatus(doc.status),
    createdAt: doc.createdAt ? asString(doc.createdAt) : undefined,
    reviewedAt: doc.reviewedAt ? asString(doc.reviewedAt) : undefined,
    reviewedBy: doc.reviewedBy ? asString(doc.reviewedBy) : undefined,
    tutorId: doc.tutorId ? asString(doc.tutorId) : undefined,
    tutorEmail: doc.tutorEmail ? asString(doc.tutorEmail) : undefined,
    tutorName: doc.tutorName ? asString(doc.tutorName) : undefined,
    tutorImage: doc.tutorImage ? asString(doc.tutorImage) : undefined,
    location: doc.location ? asString(doc.location) : undefined,
    rating:
      rating !== undefined && rating !== null && Number.isFinite(Number(rating))
        ? Number(rating)
        : undefined,
    reviews:
      reviews !== undefined && reviews !== null && Number.isFinite(Number(reviews))
        ? Number(reviews)
        : undefined,
  };
}
