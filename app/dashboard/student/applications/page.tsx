"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  Star,
  UserRound,
} from "lucide-react";

import {
  APPLICATIONS_CHANGED_EVENT,
  readApplications,
  removeApplication,
  type BookingApplication,
} from "@/lib/tuitions";
import { cancelBooking } from "@/lib/actions/postTuitions";
import { useSession } from "@/lib/auth-client";
import {
  getMyBookings,
  getMyReviews,
  type BookingRecord,
  type Review,
} from "@/lib/reviews";
import { ReviewForm } from "@/components/tuitions/ReviewForm";
import { toast } from "sonner";

function useApplications() {
  const [applications, setApplications] = React.useState<
    BookingApplication[]
  >([]);

  React.useEffect(() => {
    const sync = () => setApplications(readApplications());
    sync();
    window.addEventListener(APPLICATIONS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(APPLICATIONS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return applications;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function CancelButton({ application }: { application: BookingApplication }) {
  const [busy, setBusy] = React.useState(false);

  const handleCancel = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (application.slotId) {
        await cancelBooking(application.tuitionId, application.slotId);
      }
      removeApplication(application.tuitionId);
      toast.success("Application cancelled");
      window.dispatchEvent(new Event(APPLICATIONS_CHANGED_EVENT));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not cancel the application"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={busy}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-400/30 px-3 text-[10px] font-bold text-rose-300 transition-colors hover:bg-rose-400/10 disabled:opacity-60"
    >
      {busy ? "Cancelling..." : "Cancel application"}
    </button>
  );
}

export default function StudentApplicationsPage() {
  const applications = useApplications();
  const { data: session } = useSession();
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [reviewing, setReviewing] = React.useState<string | null>(null);

  const loadReviewData = React.useCallback(() => {
    Promise.all([getMyBookings(), getMyReviews()])
      .then(([bookingList, reviewList]) => {
        setBookings(bookingList);
        setReviews(reviewList);
      })
      .catch((error) => console.error("Failed to load review data:", error));
  }, []);

  React.useEffect(() => {
    if (!session?.user?.id) return;
    loadReviewData();
    const sync = () => loadReviewData();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, [session?.user?.id, loadReviewData]);

  function bookingFor(application: BookingApplication) {
    return bookings.find(
      (booking) =>
        booking.tuitionId === application.tuitionId &&
        (!application.slotId ||
          !booking.slotId ||
          booking.slotId === application.slotId)
    );
  }

  function hasReviewed(application: BookingApplication) {
    return reviews.some(
      (review) =>
        review.tuitionId === application.tuitionId ||
        review.tutorName === application.tutorName
    );
  }

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-[#080D0F] text-white sm:-mx-6 sm:-mt-6">
      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#B6F70B]/50 bg-[#B6F70B]/5">
            <FileText className="h-5 w-5 text-[#B6F70B]" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-white">
              My Applications
            </h1>
            <p className="mt-1.5 text-[11px] text-gray-500">
              Tuitions you have requested. Tutors will confirm your booking
              shortly.
            </p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0D1417] px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#B6F70B]/20 bg-[#B6F70B]/5">
              <BookOpen className="h-6 w-6 text-[#B6F70B]" />
            </span>
            <h2 className="mt-4 text-[15px] font-extrabold text-white">
              No applications yet
            </h2>
            <p className="mt-1.5 max-w-sm text-[12px] text-gray-500">
              Browse tuitions and apply for one to see it here.
            </p>
            <Link
              href="/tuitions"
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-[#B6F70B] px-4 text-[11px] font-extrabold text-[#0B1100] transition-colors hover:bg-[#C9FF42]"
            >
              Browse Tuitions <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-6 text-[11px] font-semibold text-gray-500">
              {applications.length} application
              {applications.length === 1 ? "" : "s"} found
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {applications.map((application) => (
                <article
                  key={application.id}
                  className="rounded-2xl border border-white/[0.07] bg-[#0D1417] p-5 shadow-[0_8px_40px_rgba(0,0,0,0.2)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-[15px] font-extrabold text-white">
                      {application.tuitionTitle}
                    </h2>
                    {bookingFor(application)?.status === "accepted" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#B6F70B]/30 bg-[#B6F70B]/10 px-2 py-0.5 text-[10px] font-bold text-[#B6F70B]">
                        <CheckCircle2 className="h-3 w-3" />
                        Added to course
                      </span>
                    ) : bookingFor(application)?.status === "rejected" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                        X Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        <Clock3 className="h-3 w-3" />
                        Awaiting tutor
                      </span>
                    )}
                  </div>

                  {!bookingFor(application) ||
                  bookingFor(application)?.status === "pending" ? (
                    <div className="mt-3">
                      <CancelButton application={application} />
                    </div>
                  ) : null}

                  {application.slotLabel && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#B6F70B]/25 bg-[#B6F70B]/[0.06] px-3 py-2 text-[11px] font-bold text-[#B6F70B]">
                      <Clock3 className="h-3.5 w-3.5 shrink-0" />
                      {application.slotLabel}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5 text-[#B6F70B]" />
                      {application.tutorName}
                      {bookingFor(application)?.tutorEmail && (
                        <span className="text-gray-500">
                          ({bookingFor(application)?.tutorEmail})
                        </span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-[#B6F70B]" />$
                      {application.fee} / month
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-[#B6F70B]" />
                      {formatDate(application.createdAt)}
                    </span>
                  </div>

                  {bookingFor(application)?.status === "accepted" && (
                    <div className="mt-4 border-t border-white/[0.06] pt-4">
                      {hasReviewed(application) ? (
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#B6F70B]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          You reviewed {application.tutorName}
                        </p>
                      ) : reviewing === application.id ? (
                        <ReviewForm
                          tuitionId={application.tuitionId}
                          tutorName={application.tutorName}
                          onReviewed={() => {
                            setReviewing(null);
                            loadReviewData();
                          }}
                          onCancel={() => setReviewing(null)}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReviewing(application.id)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#B6F70B]/40 px-4 text-[11px] font-extrabold text-[#B6F70B] transition-colors hover:bg-[#B6F70B]/10"
                        >
                          <Star className="h-3.5 w-3.5" />
                          Review {application.tutorName}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
