import { getBookings, getTuitions, type Tuition } from "@/lib/actions/postTuitions";
import { iconForSubject, type SubjectIconKey } from "@/lib/browseIcons";
import {
  normalizeSlots,
  slotsByIds,
  type TuitionSlot,
} from "@/lib/slots";

export { iconForSubject, type SubjectIconKey } from "@/lib/browseIcons";

/* ==========================================================================
   Browse-page data model
   Listings come from MongoDB via /api/tuitions and are restricted to posts an
   admin has approved. Pending and declined posts never reach this layer.
   ========================================================================== */

export type BrowseTuition = Tuition & {
  tutorName: string;
  tutorImage?: string;
  verified: boolean;
  /** null when the backend does not provide a rating */
  rating: number | null;
  reviews: number;
  location: string;
  icon: SubjectIconKey;
  /** Slots still open for booking (booked slots are removed). */
  availableSlots: TuitionSlot[];
};

function decorate(
  tuition: Tuition,
  userName: string | null | undefined,
  availableSlots: TuitionSlot[]
): BrowseTuition {
  const existing = tuition as Partial<BrowseTuition>;
  const isOnline = tuition.mode.toLowerCase() === "online";

  return {
    ...tuition,
    tutorName: existing.tutorName?.trim() || userName?.trim() || "Tutor",
    tutorImage: existing.tutorImage,
    verified: existing.verified ?? false,
    rating:
      typeof existing.rating === "number" && Number.isFinite(existing.rating)
        ? existing.rating
        : null,
    reviews:
      typeof existing.reviews === "number" && Number.isFinite(existing.reviews)
        ? existing.reviews
        : 0,
    location: existing.location?.trim() || (isOnline ? "Online" : "—"),
    icon: existing.icon ?? iconForSubject(tuition.subject),
    availableSlots,
  };
}

export type BrowseData = {
  tuitions: BrowseTuition[];
  backendReachable: boolean;
};

/** Approved tuitions only — fetched live from the database. */
export async function getBrowseData(
  userName?: string | null,
  options?: { includeApplied?: boolean }
): Promise<BrowseData> {
  let remote: Tuition[] = [];
  let backendReachable = true;
  // The details page keeps a tuition visible to the student who applied to it
  // (even when all of its slots are booked) so they can still cancel.
  const appliedIds = new Set<string>(
    options?.includeApplied
      ? readApplications().map((application) => application.tuitionId)
      : []
  );

  try {
    remote = await getTuitions("approved");
  } catch {
    backendReachable = false;
  }

  // A slot is unavailable once any student has booked it. Legacy local
  // applications (saved before slots existed) hide the whole tuition.
  const bookedSlots = new Set<string>();
  const legacyBooked = new Set<string>();
  try {
    for (const booking of await getBookings()) {
      bookedSlots.add(`${booking.tuitionId}|${booking.slotId}`);
    }
  } catch {
    /* booking list unavailable — fall back to local applications only */
  }
  for (const application of readApplications()) {
    if (application.slotId) {
      bookedSlots.add(`${application.tuitionId}|${application.slotId}`);
    } else {
      legacyBooked.add(application.tuitionId);
    }
  }

  const seen = new Set<string>();
  const tuitions: BrowseTuition[] = [];

  for (const item of remote) {
    if (legacyBooked.has(item.id) && !appliedIds.has(item.id)) continue;
    const offered = slotsByIds(normalizeSlots(item.slots));
    const available = offered.filter(
      (slot) => !bookedSlots.has(`${item.id}|${slot.id}`)
    );
    if (available.length === 0 && !appliedIds.has(item.id)) continue;

    // Same subject can be posted multiple times with different slots, so
    // dedupe by the actual record id, never by title/subject.
    const key = item.id;
    if (seen.has(key)) continue;
    seen.add(key);
    tuitions.push(decorate(item, userName, available));
  }

  return { tuitions, backendReachable };
}

export async function getAllBrowseTuitions(
  userName?: string | null,
  options?: { includeApplied?: boolean }
) {
  return (await getBrowseData(userName, options)).tuitions;
}

/* ==========================================================================
   Filter helpers
   ========================================================================== */

export const CLASS_LEVEL_OPTIONS = [
  { value: "", label: "All Class Levels" },
  { value: "class-1-5", label: "Class 1 – 5" },
  { value: "class-6-8", label: "Class 6 – 8" },
  { value: "ssc", label: "Class 9 – 10 (SSC)" },
  { value: "hsc", label: "Class 11 – 12 (HSC)" },
  { value: "university", label: "University" },
] as const;

export const SUBJECT_OPTIONS = [
  "All Subjects",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "ICT / Programming",
  "Computer Science",
  "Science",
  "Bangla",
  "Economics",
  "IELTS & Spoken English",
] as const;

export const LOCATION_OPTIONS = [
  "All Locations",
  "Dhaka",
  "Chittagong",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barisal",
  "Online",
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "fee-asc", label: "Fee: Low to High" },
  { value: "fee-desc", label: "Fee: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "reviews", label: "Most Reviewed" },
  { value: "title", label: "Title: A – Z" },
] as const;

const LEVEL_TOKENS: Record<string, string[]> = {
  "class-1-5": ["class 1", "class 1 – 5", "class 1-5"],
  "class-6-8": ["class 6", "6 – 8", "6-8"],
  ssc: ["ssc", "class 9", "9 – 10", "9-10"],
  hsc: ["hsc", "class 11", "11 – 12", "11-12"],
  university: ["univers", "admission", "ielts"],
};

export function matchesClassLevel(level: string, key: string): boolean {
  if (!key) return true;
  const tokens = LEVEL_TOKENS[key];
  if (!tokens) return true;
  const value = level.toLowerCase();
  return tokens.some((token) => value.includes(token));
}

export function matchesSubject(subject: string, filter: string): boolean {
  if (!filter || filter === "All Subjects") return true;
  const value = subject.toLowerCase();
  const needle = filter.toLowerCase();
  if (value.includes(needle)) return true;
  if (needle === "ict / programming" || needle === "computer science") {
    return /ict|program|computer|code|software/.test(value);
  }
  if (needle === "science") return /physics|chemistry|biology|scien/.test(value);
  if (needle === "ielts & spoken english") {
    return /english|ielts|spoken/.test(value);
  }
  return false;
}

export function feeValue(fee: string): number {
  const value = Number.parseFloat(String(fee).replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

export function daysValue(days: string): number {
  const value = Number.parseInt(String(days).trim(), 10);
  return Number.isFinite(value) ? value : 0;
}

export function sortTuitions(
  list: BrowseTuition[],
  sort: string
): BrowseTuition[] {
  const copy = [...list];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) =>
          new Date(a.createdAt ?? 0).getTime() -
          new Date(b.createdAt ?? 0).getTime()
      );
    case "fee-asc":
      return copy.sort((a, b) => feeValue(a.fee) - feeValue(b.fee));
    case "fee-desc":
      return copy.sort((a, b) => feeValue(b.fee) - feeValue(a.fee));
    case "rating":
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "reviews":
      return copy.sort((a, b) => b.reviews - a.reviews);
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime()
      );
  }
}

/* ==========================================================================
   Browser storage: favourites + student booking requests
   ========================================================================== */

export const FAVORITES_KEY = "tuitora:favorites";
export const APPLICATIONS_KEY = "tuitora:my-applications";
export const FAVORITES_CHANGED_EVENT = "tuitora:favorites-changed";
export const APPLICATIONS_CHANGED_EVENT = "tuitora:applications-changed";

export type BookingApplication = {
  id: string;
  tuitionId: string;
  slotId?: string;
  slotLabel?: string;
  tuitionTitle: string;
  tutorName: string;
  fee: string;
  studentName?: string;
  studentEmail?: string;
  createdAt: string;
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

export function readFavorites(): string[] {
  return readStorage<string[]>(FAVORITES_KEY, []);
}

export function toggleFavorite(tuitionId: string): string[] {
  if (typeof window === "undefined") return [];
  const current = readFavorites();
  const next = current.includes(tuitionId)
    ? current.filter((id) => id !== tuitionId)
    : [tuitionId, ...current];
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — keep the in-memory result */
  }
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));

  // Persist to MongoDB for signed-in students (localStorage stays as the
  // instant/offline mirror). Anonymous users simply keep the local copy.
  void fetch("/api/favorites", {
    method: next.includes(tuitionId) ? "POST" : "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tuitionId }),
  }).catch(() => {
    /* offline — the local copy is still correct */
  });
  return next;
}

/** Loads server-side bookmarks, merges any older local ones, and migrates
 *  those local-only ids up to the database once. */
export async function syncFavoritesFromServer(): Promise<string[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch("/api/favorites", { cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as { tuitionIds?: string[] };
    const remote = Array.isArray(payload.tuitionIds) ? payload.tuitionIds : [];
    const local = readFavorites();
    const merged = Array.from(new Set([...remote, ...local]));
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(merged));
    } catch {
      /* ignore */
    }
    for (const id of local) {
      if (!remote.includes(id)) {
        void fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tuitionId: id }),
        }).catch(() => undefined);
      }
    }
    window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
    return merged;
  } catch {
    return null;
  }
}

export function readApplications(): BookingApplication[] {
  return readStorage<BookingApplication[]>(APPLICATIONS_KEY, []);
}

export function hasApplied(tuitionId: string): boolean {
  return readApplications().some((item) => item.tuitionId === tuitionId);
}

export function removeApplication(tuitionId: string): void {
  if (typeof window === "undefined") return;
  const next = readApplications().filter((item) => item.tuitionId !== tuitionId);
  try {
    window.localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the in-memory state still updates */
  }
  window.dispatchEvent(new Event(APPLICATIONS_CHANGED_EVENT));
}

export function saveApplication(
  data: Omit<BookingApplication, "id" | "createdAt">
): BookingApplication {
  const application: BookingApplication = {
    ...data,
    id: `booking-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        APPLICATIONS_KEY,
        JSON.stringify([application, ...readApplications()])
      );
    } catch {
      /* storage unavailable — booking is still confirmed in the UI */
    }
    window.dispatchEvent(new Event(APPLICATIONS_CHANGED_EVENT));
  }
  return application;
}
