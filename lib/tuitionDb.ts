import type { Tuition, TuitionStatus } from "@/lib/actions/postTuitions";
import { getDb } from "@/lib/mongodb";
import { normalizeSlots } from "@/lib/slots";
import { safeImageUrl } from "@/lib/utils";
import { cleanText, normalizeApprovalStatus, normalizeMode } from "@/lib/validation";

/** Same collection the existing backend uses, so old posts stay visible. */
export const TUITION_COLLECTION = "courses";

export async function getTuitionCollection() {
  const db = await getDb();
  return db.collection(TUITION_COLLECTION);
}

export function normalizeStatus(value: unknown): TuitionStatus {
  const approval = normalizeApprovalStatus(value);
  return approval === "rejected" ? "declined" : approval;
}

type LooseDoc = Record<string, unknown> & { _id?: unknown };

function asString(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

/** Converts a raw Mongo document into the shape the UI consumes.
 *  Both legacy names (fee/days/bannerUrl/status) and the canonical schema
 *  names (monthlyFee/daysPerWeek/bannerImage/approvalStatus) are returned. */
export function serializeTuition(doc: LooseDoc): Tuition {
  const rating = doc.rating;
  const reviews = doc.reviews;
  const status = normalizeStatus(doc.status);
  const approvalStatus = status === "declined" ? "rejected" : status;
  const fee = asString(doc.monthlyFee ?? doc.fee);
  const days = asString(doc.daysPerWeek ?? doc.days);
  const bannerUrl =
    safeImageUrl(doc.bannerImage) || safeImageUrl(doc.bannerUrl) || undefined;

  return {
    id: asString(doc._id),
    title: cleanText(doc.title, 100) || "Untitled tuition",
    subject: asString(doc.subject),
    classLevel: asString(doc.classLevel),
    mode: normalizeMode(doc.mode),
    fee,
    days,
    bannerName: asString(doc.bannerName),
    bannerUrl,
    description: asString(doc.description),
    slots: normalizeSlots(doc.slots),
    status,
    approvalStatus,
    monthlyFee: fee,
    daysPerWeek: days,
    bannerImage: bannerUrl,
    isActive: doc.isActive !== false && doc.isActive !== "false",
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

/* ==========================================================================
   Server-side browse query — search / filter / sort / pagination happen in
   MongoDB (not in the browser). The Express API applies the same rules.
   ========================================================================== */

export type BrowseQuery = {
  search?: string;
  subject?: string;
  classLevel?: string;
  location?: string;
  mode?: string;
  modes?: string[];
  levels?: string[];
  minFee?: number;
  maxFee?: number;
  days?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

export type BrowsePagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  prev: number | null;
  next: number | null;
};

const LEVEL_TOKENS: Record<string, string[]> = {
  "class-1-5": ["class 1", "class 1 – 5", "class 1-5"],
  "class-6-8": ["class 6", "6 – 8", "6-8"],
  ssc: ["ssc", "class 9", "9 – 10", "9-10"],
  hsc: ["hsc", "class 11", "11 – 12", "11-12"],
  university: ["univers", "admission", "ielts"],
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function regex(value: string): RegExp {
  return new RegExp(escapeRegex(value), "i");
}

function classLevelMatch(key: string): Record<string, unknown> | null {
  const tokens = LEVEL_TOKENS[key];
  if (!tokens) return null;
  return { $or: tokens.map((token) => ({ classLevel: regex(token) })) };
}

export function buildBrowseFilter(query: BrowseQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    status: "approved",
    isActive: { $ne: false },
  };
  const and: Record<string, unknown>[] = [];

  const search = (query.search || "").trim();
  // Requirement: search by tuition title or subject. Tutor/description are
  // included as a convenience so the existing home search keeps working.
  if (search) {
    and.push({
      $or: ["title", "subject", "description", "tutorName"].map((field) => ({
        [field]: regex(search),
      })),
    });
  }
  if (query.subject && query.subject !== "All Subjects") {
    and.push({ subject: regex(query.subject) });
  }
  if (query.classLevel && query.classLevel !== "All Class Levels") {
    and.push(classLevelMatch(query.classLevel) ?? { classLevel: regex(query.classLevel) });
  }
  for (const level of query.levels || []) {
    const match = classLevelMatch(level);
    if (match) and.push(match);
  }
  const modes = query.modes || [];
  const mode = (query.mode || "").toLowerCase();
  if (mode === "online" || mode === "offline") modes.push(mode);
  if (modes.length) {
    and.push({
      $or: Array.from(new Set(modes)).map((value) => ({ mode: regex(value) })),
    });
  }
  if (query.location) {
    if (query.location.toLowerCase() === "online") {
      and.push({ mode: regex("online") });
    } else {
      and.push({ location: regex(query.location) });
    }
  }
  if (query.minFee !== undefined || query.maxFee !== undefined) {
    const fee: Record<string, number> = {};
    if (query.minFee !== undefined) fee.$gte = query.minFee;
    if (query.maxFee !== undefined) fee.$lte = query.maxFee;
    and.push({ feeValue: fee });
  }
  if (query.days && /^\d+$/.test(query.days)) {
    and.push({
      $or: [
        { daysValue: Number(query.days) },
        { days: regex(`${query.days} Days`) },
        { daysPerWeek: regex(`${query.days} Days`) },
      ],
    });
  }
  if (and.length) filter.$and = and;
  return filter;
}

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  oldest: { createdAt: 1 },
  "fee-asc": { feeValue: 1, createdAt: -1 },
  "fee-desc": { feeValue: -1, createdAt: -1 },
  title: { title: 1 },
  rating: { rating: -1, createdAt: -1 },
  reviews: { reviews: -1, createdAt: -1 },
};

/** Approved tuitions only, with MongoDB doing the skip/limit work. */
export async function queryApprovedTuitions(query: BrowseQuery): Promise<{
  tuitions: Tuition[];
  pagination: BrowsePagination;
}> {
  const collection = await getTuitionCollection();
  const filter = buildBrowseFilter(query);
  const page = Math.max(1, Math.floor(query.page || 1));
  const limit = Math.min(60, Math.max(1, Math.floor(query.limit || 12)));
  const total = await collection.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const sort = SORT_MAP[query.sort || "newest"] || { createdAt: -1 };

  const docs = await collection
    .find(filter)
    .sort(sort)
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .toArray();

  return {
    tuitions: docs.map(serializeTuition),
    pagination: {
      total,
      page: currentPage,
      limit,
      totalPages,
      hasPrev: currentPage > 1,
      hasNext: currentPage < totalPages,
      prev: currentPage > 1 ? currentPage - 1 : null,
      next: currentPage < totalPages ? currentPage + 1 : null,
    },
  };
}

/** Unfiltered sidebar counts, computed on the server from approved posts. */
export async function getBrowseFacets(): Promise<{
  modes: { online: number; offline: number };
  levels: Record<string, number>;
}> {
  const collection = await getTuitionCollection();
  const base = { status: "approved", isActive: { $ne: false } };
  const [online, offline, ...levelCounts] = await Promise.all([
    collection.countDocuments({ ...base, mode: regex("online") }),
    collection.countDocuments({ ...base, mode: regex("offline") }),
    ...Object.keys(LEVEL_TOKENS).map((key) =>
      collection.countDocuments({ ...base, ...classLevelMatch(key)! })
    ),
  ]);
  return {
    modes: { online, offline },
    levels: Object.fromEntries(
      Object.keys(LEVEL_TOKENS).map((key, index) => [key, levelCounts[index]])
    ),
  };
}
