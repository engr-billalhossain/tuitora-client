/* ==========================================================================
   Tuition data access — backed by MongoDB through our own Route Handlers.

   State machine:
     pending   -> visible only in the admin approval queue + the tutor who posted it
     approved  -> visible everywhere (browse, details, etc.) with an approved label
     declined  -> visible only to the tutor who posted it, with a declined label
   ========================================================================== */

import { authFetch } from "@/lib/auth-token";
import { PLAN_LIMIT_REACHED, PlanLimitError } from "@/lib/plan-limits";

export type TuitionStatus = "pending" | "approved" | "declined";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type Tuition = {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  mode: "Online" | "Offline" | string;
  fee: string;
  days: string;
  bannerName: string;
  /** Public URL of the banner uploaded to ImgBB; used as the card background. */
  bannerUrl?: string;
  description: string;
  /** Daily time slots this tutor offers for this subject. */
  slots?: string[];
  /** Legacy status kept for existing UI: pending | approved | declined. */
  status: TuitionStatus;
  /** Canonical approval status: pending | approved | rejected. */
  approvalStatus: ApprovalStatus;
  /** Canonical aliases of the legacy fee / days / banner fields. */
  monthlyFee: string;
  daysPerWeek: string;
  bannerImage?: string;
  /** Inactive posts are hidden from students but kept for the tutor/admin. */
  isActive: boolean;
  createdAt?: string;
  /** Set by the backend when an admin reviews the post. */
  reviewedAt?: string;
  reviewedBy?: string;
  /** Tutor identity, attached from the signed-in session on creation. */
  tutorId?: string;
  tutorEmail?: string;
  tutorName?: string;
  tutorImage?: string;
  location?: string;
  rating?: number | null;
  reviews?: number;
};

export type TuitionInput = {
  title: string;
  subject: string;
  classLevel: string;
  mode: string;
  fee: string;
  days: string;
  bannerName: string;
  bannerUrl?: string;
  description: string;
  slots: string[];
  location?: string;
};

export type Booking = {
  id: string;
  tuitionId: string;
  tuitionTitle?: string;
  subject?: string;
  monthlyFee?: string;
  tutorEmail?: string;
  slotId: string;
  slotLabel: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  preferredSchedule?: string;
  studentNote?: string;
  status: "pending" | "accepted" | "rejected";
  appliedAt?: string;
  createdAt: string;
};

export type TuitionPayload = { tuitions: Tuition[] };

async function readPayload(response: Response): Promise<Tuition[]> {
  const payload = (await response.json().catch(() => ({}))) as Partial<TuitionPayload>;
  return Array.isArray(payload.tuitions) ? payload.tuitions : [];
}

/**
 * Fetches tuitions by status. Public pages must only request "approved".
 * Admin pages request "pending" / "declined" / "all".
 */
export const getTuitions = async (
  status: string = "approved"
): Promise<Tuition[]> => {
  const response = await authFetch(`/api/tuitions?status=${encodeURIComponent(status)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch tuitions");
  return readPayload(response);
};

/** Server-side search/filter/pagination result from GET /api/tuitions. */
export type TuitionSearchResult = {
  tuitions: Tuition[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
    prev: number | null;
    next: number | null;
  };
};

export type TuitionSearchParams = {
  search?: string;
  subject?: string;
  classLevel?: string;
  mode?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

/** Client wrapper for the server-side browse query. */
export const searchTuitions = async (
  params: TuitionSearchParams = {}
): Promise<TuitionSearchResult> => {
  const query = new URLSearchParams({ status: "approved" });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const response = await authFetch(`/api/tuitions?${query.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to search tuitions");
  return (await response.json()) as TuitionSearchResult;
};

/** Tuitions belonging to the signed-in tutor, in every status. */
export const getMyTuitions = async (): Promise<Tuition[]> => {
  const response = await authFetch("/api/tuitions?scope=mine", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch your tuitions");
  return readPayload(response);
};

export const createTuition = async (data: TuitionInput): Promise<Tuition> => {
  const response = await authFetch("/api/tuitions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
    };
    if (payload.code === PLAN_LIMIT_REACHED) {
      throw new PlanLimitError(
        payload.error || "Free plan tuition limit reached"
      );
    }
    throw new Error(payload.error || "Failed to create tuition");
  }
  const payload = (await response.json()) as { tuition: Tuition };
  return payload.tuition;
};

/** All slot-level bookings (used to compute per-slot availability). */
export const getBookings = async (): Promise<Booking[]> => {
  const response = await authFetch("/api/bookings", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load bookings");
  const payload = (await response.json()) as { bookings?: Booking[] };
  return Array.isArray(payload.bookings) ? payload.bookings : [];
};

/** Student: books one specific slot of an approved tuition. */
export const createBooking = async (
  tuitionId: string,
  slotId: string,
  details: {
    studentNote?: string;
    studentPhone?: string;
    preferredSchedule?: string;
  } = {}
): Promise<void> => {
  const response = await authFetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tuitionId,
      slotId,
      studentNote: details.studentNote,
      studentPhone: details.studentPhone,
      preferredSchedule: details.preferredSchedule,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
    };
    if (payload.code === PLAN_LIMIT_REACHED) {
      throw new PlanLimitError(
        payload.error || "Free plan application limit reached"
      );
    }
    throw new Error(payload.error || "This slot is no longer available");
  }
};

/** Student: cancels their own booking so the slot opens up again. */
export const cancelBooking = async (
  tuitionId: string,
  slotId: string
): Promise<void> => {
  const response = await authFetch("/api/bookings", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tuitionId, slotId }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Could not cancel your booking");
  }
};

/** Admin-only: approves, declines or returns a tuition to review. */
export const updateTuitionStatus = async (
  id: string,
  status: TuitionStatus
): Promise<Tuition> => {
  return updateTuition(id, { status });
};

/** Admin-only: updates status and/or editable tuition fields. */
export const updateTuition = async (
  id: string,
  patch: Partial<
    Pick<
      Tuition,
      | "status"
      | "title"
      | "subject"
      | "classLevel"
      | "mode"
      | "fee"
      | "days"
      | "bannerName"
      | "bannerUrl"
      | "description"
      | "slots"
    >
  >
): Promise<Tuition> => {
  const response = await authFetch(`/api/tuitions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Failed to update tuition status");
  }
  const payload = (await response.json()) as { tuition: Tuition };
  return payload.tuition;
};

/** Tutor-only edit of their own tuition. Status/approval are never editable here. */
export const updateMyTuition = async (
  id: string,
  patch: Partial<
    Pick<
      Tuition,
      | "title"
      | "subject"
      | "classLevel"
      | "mode"
      | "fee"
      | "days"
      | "bannerName"
      | "bannerUrl"
      | "description"
      | "slots"
      | "location"
      | "isActive"
    >
  >
): Promise<Tuition> => {
  const response = await authFetch(`/api/tuitions/mine/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Failed to update tuition");
  }
  const payload = (await response.json()) as { tuition: Tuition };
  return payload.tuition;
};
