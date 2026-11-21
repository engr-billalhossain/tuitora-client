import type { BrowseTuition } from "@/lib/tuitions";
import type { Tuition } from "@/lib/actions/postTuitions";
import { normalizeSlots, slotsByIds, type TuitionSlot } from "@/lib/slots";
import { getDb } from "@/lib/mongodb";
import {
  getBrowseFacets,
  queryApprovedTuitions,
  serializeTuition,
  type BrowsePagination,
  type BrowseQuery,
} from "@/lib/tuitionDb";
import { iconForSubject } from "@/lib/browseIcons";

export type BrowseResult = {
  tuitions: BrowseTuition[];
  pagination: BrowsePagination;
  facets: { modes: { online: number; offline: number }; levels: Record<string, number> };
  /** Which API actually served the listings (useful in the UI / debugging). */
  source: "express" | "mongodb";
};

export type { BrowseFilterState } from "@/lib/browseFilters";

function toQueryString(query: BrowseQuery): string {
  const params = new URLSearchParams({
    status: "approved",
    page: String(query.page || 1),
    limit: String(query.limit || 12),
    sort: query.sort || "newest",
  });
  if (query.search) params.set("search", query.search);
  if (query.subject) params.set("subject", query.subject);
  if (query.classLevel) params.set("classLevel", query.classLevel);
  if (query.location) params.set("location", query.location);
  if (query.modes?.length) params.set("modes", query.modes.join(","));
  if (query.levels?.length) params.set("levels", query.levels.join(","));
  if (query.minFee !== undefined) params.set("minFee", String(query.minFee));
  if (query.maxFee !== undefined) params.set("maxFee", String(query.maxFee));
  if (query.days) params.set("days", query.days);
  return params.toString();
}

/** Try the separate Express API first (when it is running), then fall back
 *  to the same MongoDB query through the Next.js server. */
async function fetchRemote(
  query: BrowseQuery
): Promise<{ tuitions: Tuition[]; pagination: BrowsePagination; facets: BrowseResult["facets"] } | null> {
  const base = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (!base) return null;
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/courses?${toQueryString(query)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      tuitions?: Record<string, unknown>[];
      pagination?: BrowsePagination;
      facets?: BrowseResult["facets"];
    };
    if (!Array.isArray(payload.tuitions) || !payload.pagination) return null;
    return {
      tuitions: payload.tuitions.map((doc) => serializeTuition(doc)),
      pagination: payload.pagination,
      facets:
        payload.facets ||
        (await getBrowseFacets()),
    };
  } catch {
    return null;
  }
}

async function bookedSlotKeys(): Promise<Set<string>> {
  const db = await getDb();
  const docs = await db
    .collection("bookings")
    .find({ status: { $ne: "rejected" } })
    .project({ tuitionId: 1, slotId: 1 })
    .toArray();
  const keys = new Set<string>();
  for (const doc of docs) {
    if (doc.tuitionId && doc.slotId) {
      keys.add(`${String(doc.tuitionId)}|${String(doc.slotId)}`);
    }
  }
  return keys;
}

function decorate(tuition: Tuition, booked: Set<string>): BrowseTuition | null {
  const offered = slotsByIds(normalizeSlots(tuition.slots));
  const available: TuitionSlot[] = offered.filter(
    (slot) => !booked.has(`${tuition.id}|${slot.id}`)
  );
  if (!available.length) return null;

  const isOnline = tuition.mode.toLowerCase() === "online";
  return {
    ...tuition,
    tutorName: tuition.tutorName?.trim() || "Tutor",
    tutorImage: tuition.tutorImage,
    verified: false,
    rating: typeof tuition.rating === "number" ? tuition.rating : null,
    reviews: tuition.reviews || 0,
    location: tuition.location?.trim() || (isOnline ? "Online" : "—"),
    icon: iconForSubject(tuition.subject),
    availableSlots: available,
  };
}

/** Fully server-side browse data: query + availability + pagination. */
export async function getServerBrowseData(query: BrowseQuery): Promise<BrowseResult> {
  const remote = await fetchRemote(query);
  const local = remote ? null : await queryApprovedTuitions(query);
  const tuitions = remote?.tuitions ?? local!.tuitions;
  const pagination = remote?.pagination ?? local!.pagination;
  const facets = remote?.facets ?? (await getBrowseFacets());
  const booked = await bookedSlotKeys();

  return {
    tuitions: tuitions.map((item) => decorate(item, booked)).filter(Boolean) as BrowseTuition[],
    pagination,
    facets,
    source: remote ? "express" : "mongodb",
  };
}
