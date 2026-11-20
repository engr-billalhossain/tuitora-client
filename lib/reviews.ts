/* Client-side access to reviews and the tutor's "add to course" step. */

export type BookingStatus = "pending" | "enrolled";

export type BookingRecord = {
  id: string;
  tuitionId: string;
  slotId: string;
  slotLabel: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: BookingStatus;
  tuitionTitle?: string;
  subject?: string;
  createdAt: string;
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
  const response = await fetch("/api/reviews", { cache: "no-store" });
  if (!response.ok) await readError(response, "Failed to load reviews");
  const payload = (await response.json()) as { reviews?: Review[] };
  return Array.isArray(payload.reviews) ? payload.reviews : [];
}

export async function getMyReviews(): Promise<Review[]> {
  const response = await fetch("/api/reviews?scope=mine", { cache: "no-store" });
  if (!response.ok) await readError(response, "Failed to load your reviews");
  const payload = (await response.json()) as { reviews?: Review[] };
  return Array.isArray(payload.reviews) ? payload.reviews : [];
}

export async function getMyBookings(): Promise<BookingRecord[]> {
  const response = await fetch("/api/bookings?scope=mine", { cache: "no-store" });
  if (!response.ok) await readError(response, "Failed to load your applications");
  const payload = (await response.json()) as { bookings?: BookingRecord[] };
  return Array.isArray(payload.bookings) ? payload.bookings : [];
}

export async function getTeacherBookings(): Promise<BookingRecord[]> {
  const response = await fetch("/api/bookings?scope=teacher", { cache: "no-store" });
  if (!response.ok) await readError(response, "Failed to load applicants");
  const payload = (await response.json()) as { bookings?: BookingRecord[] };
  return Array.isArray(payload.bookings) ? payload.bookings : [];
}

/** Tutor accepts an applicant, allowing that student to review the tutor. */
export async function enrollStudent(bookingId: string): Promise<void> {
  const response = await fetch("/api/bookings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId }),
  });
  if (!response.ok) await readError(response, "Failed to add student to course");
}

export async function createReview(input: {
  tuitionId: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) await readError(response, "Failed to save your review");
  const payload = (await response.json()) as { review: Review };
  return payload.review;
}
