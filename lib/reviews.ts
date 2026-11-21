/* Client-side access to reviews and the tutor's "add to course" step. */

import { authFetch } from "@/lib/auth-token";

export type BookingStatus = "pending" | "accepted" | "rejected";

export type BookingRecord = {
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
  status: BookingStatus;
  appliedAt?: string;
  createdAt: string;
  respondedAt?: string;
};

export type Review = {
  id: string;
  tuitionId: string;
  tutorId: string;
  tutorName: string;
  tutorImage?: string;
  subject: string;
  studentId: string;
  studentName: string;
  studentImage?: string;
  rating: number;
  comment: string;
  createdAt: string;
};

async function readError(response: Response, fallback: string): Promise<never> {
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  throw new Error(payload.error || fallback);
}

export async function getReviews(): Promise<Review[]> {
  const response = await authFetch("/api/reviews", { cache: "no-store" });
  if (!response.ok) await readError(response, "Failed to load reviews");
  const payload = (await response.json()) as { reviews?: Review[] };
  return Array.isArray(payload.reviews) ? payload.reviews : [];
}

export async function getMyReviews(): Promise<Review[]> {
  const response = await authFetch("/api/reviews?scope=mine", { cache: "no-store" });
  if (!response.ok) await readError(response, "Failed to load your reviews");
  const payload = (await response.json()) as { reviews?: Review[] };
  return Array.isArray(payload.reviews) ? payload.reviews : [];
}

export async function getMyBookings(): Promise<BookingRecord[]> {
  const response = await authFetch("/api/bookings?scope=mine", { cache: "no-store" });
  if (!response.ok) await readError(response, "Failed to load your applications");
  const payload = (await response.json()) as { bookings?: BookingRecord[] };
  return Array.isArray(payload.bookings) ? payload.bookings : [];
}

export async function getTeacherBookings(): Promise<BookingRecord[]> {
  const response = await authFetch("/api/bookings?scope=teacher", { cache: "no-store" });
  if (!response.ok) await readError(response, "Failed to load applicants");
  const payload = (await response.json()) as { bookings?: BookingRecord[] };
  return Array.isArray(payload.bookings) ? payload.bookings : [];
}

/** Tutor accepts or rejects an applicant. */
export async function respondToApplication(
  bookingId: string,
  action: "accept" | "reject"
): Promise<void> {
  const response = await authFetch("/api/bookings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, action }),
  });
  if (!response.ok) await readError(response, "Failed to respond to application");
}

/** Backwards-compatible alias used by existing UI. */
export async function enrollStudent(bookingId: string): Promise<void> {
  return respondToApplication(bookingId, "accept");
}

export async function createReview(input: {
  tuitionId: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  const response = await authFetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) await readError(response, "Failed to save your review");
  const payload = (await response.json()) as { review: Review };
  return payload.review;
}
