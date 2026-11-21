"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DollarSign,
  GraduationCap,
  Heart,
  MapPin,
  Monitor,
  Search,
  ShieldCheck,
  Star,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/lib/auth-client";
import {
  APPLICATIONS_CHANGED_EVENT,
  FAVORITES_CHANGED_EVENT,
  getAllBrowseTuitions,
  matchesSubject,
  readFavorites,
  syncFavoritesFromServer,
  toggleFavorite,
  type BrowseTuition,
} from "@/lib/tuitions";
import { bannerBackgroundStyle, cn } from "@/lib/utils";
import {
  getMyBookings,
  getMyReviews,
  type BookingRecord,
  type Review,
} from "@/lib/reviews";
import { ReviewForm } from "@/components/tuitions/ReviewForm";
import { BookButton } from "@/components/tuitions/BookButton";
import { CancelApplicationButton } from "@/components/tuitions/CancelApplicationButton";
import { SubjectIconTile } from "@/components/tuitions/SubjectIcon";
import { TutorAvatar } from "@/components/tuitions/TutorAvatar";
import { TuitionCard } from "@/components/tuitions/TuitionCard";

const HIGHLIGHTS = [
  "Personalised lessons matched to your current level",
  "Step-by-step explanations with worked examples",
  "Regular practice sheets and doubt-clearing sessions",
  "Progress feedback after every class",
];

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8 lg:px-12">
      <div className="h-4 w-56 animate-pulse rounded bg-white/5" />
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="h-[520px] animate-pulse rounded-2xl bg-[#10191D]" />
        <div className="h-[360px] animate-pulse rounded-2xl bg-[#10191D]" />
      </div>
    </div>
  );
}

export function TuitionDetails() {
  const params = useParams();
  const { data: session } = useSession();
  const rawId = params?.id;
  const tuitionId =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId)
        ? rawId[0]
        : "";

  const [tuitions, setTuitions] = React.useState<BrowseTuition[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [favorite, setFavorite] = React.useState(false);
  const [myBookings, setMyBookings] = React.useState<BookingRecord[]>([]);
  const [myReviews, setMyReviews] = React.useState<Review[]>([]);

  const loadTuition = React.useCallback(() => {
    let active = true;
    // Keep the tuition visible to a student who applied to it even when all
    // of its slots are booked, so the cancel button stays reachable.
    getAllBrowseTuitions(session?.user?.name, { includeApplied: true })
      .then((list) => {
        if (active) setTuitions(list);
      })
      .catch((error) => {
        console.error(`Failed to load tuition ${tuitionId}:`, error);
        if (active) {
          setTuitions([]);
          toast.error("Could not load this tuition. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.user?.name, tuitionId]);

  React.useEffect(() => loadTuition(), [loadTuition]);

  // Refresh the slot list whenever an application is added or cancelled.
  React.useEffect(() => {
    const sync = () => loadTuition();
    window.addEventListener(APPLICATIONS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(APPLICATIONS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [loadTuition]);

  React.useEffect(() => {
    const sync = () => setFavorite(readFavorites().includes(tuitionId));
    sync();
    // Pull bookmarks saved on another device / another browser session.
    void syncFavoritesFromServer().then(sync);
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [tuitionId]);

  // A student may review the tutor only after being added to the course.
  React.useEffect(() => {
    if (!session?.user?.id || !tuitionId) return;
    let active = true;
    Promise.all([getMyBookings(), getMyReviews()])
      .then(([bookingList, reviewList]) => {
        if (active) {
          setMyBookings(bookingList);
          setMyReviews(reviewList);
        }
      })
      .catch((error) => {
        console.error("Failed to load review data:", error);
        if (active) toast.error("Could not load your review data.");
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id, tuitionId]);

  if (loading) return <DetailSkeleton />;

  const tuition = tuitions.find((item) => item.id === tuitionId);

  if (!tuition) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#080D0F] px-4 text-white">
        <div className="max-w-md text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#B6F70B]/20 bg-[#B6F70B]/5">
            <Search className="h-7 w-7 text-[#B6F70B]" />
          </span>
          <h1 className="mt-5 text-[20px] font-extrabold">Tuition not found</h1>
          <p className="mt-2 text-[12px] leading-relaxed text-gray-400">
            This tuition may have been removed, or the link is incorrect. Browse
            the full catalogue to find something similar.
          </p>
          <Link
            href="/tuitions"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#B6F70B] px-5 text-[12px] font-extrabold text-[#0B1100] transition-colors hover:bg-[#C9FF42]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to all tuitions
          </Link>
        </div>
      </div>
    );
  }

  const isOnline = tuition.mode.toLowerCase() === "online";
  const role = session?.user?.role;
  const isStudent = !role || role === "student";
  const isEnrolled = myBookings.some(
    (booking) => booking.tuitionId === tuition.id && booking.status === "accepted"
  );
  const alreadyReviewed = myReviews.some(
    (review) =>
      review.tuitionId === tuition.id || review.tutorName === tuition.tutorName
  );
  const related = tuitions
    .filter(
      (item) =>
        item.id !== tuition.id &&
        (matchesSubject(item.subject, tuition.subject) ||
          item.classLevel === tuition.classLevel)
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#080D0F] pb-16 text-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-8 lg:px-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-gray-500"
        >
          <Link href="/" className="transition-colors hover:text-[#B6F70B]">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href="/tuitions"
            className="transition-colors hover:text-[#B6F70B]"
          >
            Browse Tuitions
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="max-w-[280px] truncate text-gray-300">
            {tuition.title}
          </span>
        </nav>

        <Link
          href="/tuitions"
          className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#B6F70B] transition-colors hover:text-[#C9FF42]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to results
        </Link>

        <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          {/* Main content */}
          <div className="min-w-0 space-y-5">
            {/* Hero card */}
            <article
              style={bannerBackgroundStyle(tuition.bannerUrl)}
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#141C21] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <SubjectIconTile
                    icon={tuition.icon}
                    className="h-12 w-12"
                    iconClassName="h-6 w-6"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-md border border-[#B6F70B]/25 bg-[#B6F70B]/10 px-2 py-0.5 text-[10px] font-bold text-[#B6F70B]">
                        {tuition.classLevel}
                      </span>
                      <span className="rounded-md border border-white/10 bg-[#1B252B] px-2 py-0.5 text-[10px] font-semibold text-gray-300">
                        {tuition.subject}
                      </span>
                      {tuition.status === "approved" && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-[#B6F70B]/25 bg-[#B6F70B]/10 px-2 py-0.5 text-[10px] font-bold text-[#B6F70B]">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Approved
                        </span>
                      )}
                    </div>
                    <h1 className="mt-2 text-[21px] leading-snug font-extrabold tracking-tight text-white sm:text-[25px]">
                      {tuition.title}
                    </h1>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = toggleFavorite(tuition.id);
                    toast.success(
                      next.includes(tuition.id)
                        ? "Added to your wishlist"
                        : "Removed from your wishlist"
                    );
                  }}
                  aria-label={favorite ? "Remove from wishlist" : "Add to wishlist"}
                  aria-pressed={favorite}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#0F171B] text-gray-500 transition-colors hover:border-rose-400/40 hover:text-rose-400"
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      favorite && "fill-rose-500 text-rose-500"
                    )}
                  />
                </button>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/[0.06] pt-5">
                <div className="flex items-center gap-2.5">
                  <TutorAvatar
                    name={tuition.tutorName}
                    src={tuition.tutorImage}
                    className="h-10 w-10 text-xs"
                  />
                  <div>
                    <p className="flex items-center gap-1.5 text-[13px] font-bold text-white">
                      {tuition.tutorName}
                      {tuition.verified && (
                        <BadgeCheck className="h-4 w-4 text-[#B6F70B]" />
                      )}
                    </p>
                    <p className="flex items-center gap-1 text-[10px] font-semibold text-gray-400">
                      {tuition.rating !== null ? (
                        <>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-amber-300">
                            {tuition.rating.toFixed(1)}
                          </span>
                          {tuition.reviews > 0 && (
                            <span className="font-normal text-gray-500">
                              ({tuition.reviews} reviews)
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="font-normal text-gray-500">
                          New tutor
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="hidden h-8 w-px bg-white/10 sm:block" />
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-gray-300">
                  <span className="inline-flex items-center gap-1.5">
                    {isOnline ? (
                      <Video className="h-4 w-4 text-[#B6F70B]" />
                    ) : (
                      <MapPin className="h-4 w-4 text-[#B6F70B]" />
                    )}
                    {isOnline ? "Online" : "In person"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-[#B6F70B]" />
                    {tuition.days}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#B6F70B]" />
                    {tuition.location}
                  </span>
                </div>
              </div>
            </article>

            {/* About */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#10191D] p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-white">
                <BookOpen className="h-4 w-4 text-[#B6F70B]" />
                About this tuition
              </h2>
              <p className="mt-3 text-[12px] leading-[1.85] text-gray-400">
                {tuition.description || "No description was provided for this tuition."}
              </p>

              <h3 className="mt-6 text-[13px] font-extrabold text-white">
                What you&apos;ll get
              </h3>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {HIGHLIGHTS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[11px] leading-relaxed text-gray-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B6F70B]" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Class details */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#10191D] p-5 sm:p-6">
              <h2 className="text-[15px] font-extrabold text-white">
                Class details
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: Monitor,
                    label: "Tuition Mode",
                    value: isOnline ? "Online (Zoom / Meet)" : "Offline (In-Person)",
                  },
                  {
                    icon: GraduationCap,
                    label: "Class Level",
                    value: tuition.classLevel,
                  },
                  {
                    icon: CalendarDays,
                    label: "Schedule",
                    value: `${tuition.days} · ${tuition.mode.toLowerCase()}`,
                  },
                  {
                    icon: DollarSign,
                    label: "Monthly Fee",
                    value: `$${tuition.fee} / month`,
                  },
                  {
                    icon: MapPin,
                    label: "Location",
                    value: tuition.location,
                  },
                  {
                    icon: Users,
                    label: "Batch format",
                    value: "Small group · Personal attention",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#141C21] p-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#B6F70B]/20 bg-[#B6F70B]/5">
                      <item.icon className="h-4 w-4 text-[#B6F70B]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-500">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-gray-200">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Available slots */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#10191D] p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-white">
                <Clock3 className="h-4 w-4 text-[#B6F70B]" />
                Available time slots
              </h2>
              <p className="mt-1 text-[11px] text-gray-500">
                Select one of the open slots before applying. Booked slots are
                never shown.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tuition.availableSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="rounded-xl border border-[#B6F70B]/20 bg-[#B6F70B]/[0.04] p-3"
                  >
                    <p className="text-[11px] font-bold text-white">{slot.label}</p>
                    <p className="mt-1 text-[10px] font-semibold text-[#B6F70B]">
                      {slot.start} – {slot.end}
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-500">
                      {slot.duration}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tutor */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#10191D] p-5 sm:p-6">
              <h2 className="text-[15px] font-extrabold text-white">
                About the tutor
              </h2>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <TutorAvatar
                  name={tuition.tutorName}
                  src={tuition.tutorImage}
                  className="h-14 w-14 text-sm"
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[15px] font-extrabold text-white">
                    {tuition.tutorName}
                    {tuition.verified && (
                      <BadgeCheck className="h-4 w-4 text-[#B6F70B]" />
                    )}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {tuition.verified ? "Verified tutor" : "Tutor"} ·{" "}
                    {tuition.reviews > 0
                      ? `${tuition.reviews} student reviews`
                      : "No reviews yet"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[12px] leading-[1.8] text-gray-400">
                This tuition covers {tuition.subject} for{" "}
                {tuition.classLevel} students. Additional tutor profile details
                are not available yet.
              </p>
            </section>

            {/* Review — only after the tutor adds this student to the course */}
            {isStudent && isEnrolled && (
              <section className="rounded-2xl border border-white/[0.07] bg-[#10191D] p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-white">
                  <Star className="h-4 w-4 text-[#B6F70B]" />
                  Review {tuition.tutorName}
                </h2>
                <p className="mt-1 text-[11px] text-gray-500">
                  You joined this course. Share your experience with other students.
                </p>
                <div className="mt-4">
                  {alreadyReviewed ? (
                    <p className="flex items-center gap-2 rounded-xl border border-[#B6F70B]/25 bg-[#B6F70B]/5 px-4 py-3 text-[12px] font-semibold text-[#B6F70B]">
                      <CheckCircle2 className="h-4 w-4" />
                      You have already reviewed this tutor. Thank you!
                    </p>
                  ) : (
                    <ReviewForm
                      tuitionId={tuition.id}
                      tutorName={tuition.tutorName}
                      onReviewed={() => {
                        getMyReviews().then(setMyReviews).catch(() => undefined);
                      }}
                    />
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Booking sidebar */}
          <aside className="lg:sticky lg:top-[86px]">
            <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#141C21] shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
              <div className="border-b border-white/[0.06] bg-[#B6F70B]/5 p-5">
                <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                  Monthly fee
                </p>
                <p className="mt-1 text-[30px] leading-none font-extrabold tracking-tight text-white">
                  ${tuition.fee}
                  <span className="ml-1 text-[12px] font-semibold text-gray-400">
                    / month
                  </span>
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#B6F70B]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  No payment until the tutor confirms
                </p>
              </div>

              <div className="p-5">
                <ul className="space-y-3">
                  {[
                    { icon: Clock3, label: `${tuition.days} of live classes` },
                    {
                      icon: isOnline ? Video : MapPin,
                      label: isOnline ? "Online via Zoom / Meet" : tuition.location,
                    },
                    { icon: BookOpen, label: `${tuition.subject} · ${tuition.classLevel}` },
                  ].map((item) => (
                    <li
                      key={item.label}
                      className="flex items-start gap-2.5 text-[11px] font-semibold text-gray-300"
                    >
                      <item.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B6F70B]" />
                      {item.label}
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {isStudent ? (
                    <BookButton tuition={tuition} variant="details" />
                  ) : (
                    <div>
                      <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2.5 text-[11px] font-semibold text-amber-200">
                        Only students can apply for a tuition. Switch to a student
                        account to send an application.
                      </p>
                      <button
                        type="button"
                        disabled
                        className="mt-3 inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[12px] font-bold text-gray-500"
                      >
                        Apply Now (Students only)
                      </button>
                    </div>
                  )}
                </div>

                <p className="mt-3 text-center text-[10px] leading-relaxed text-gray-500">
                  Booking requests can only be sent by signed-in students.
                </p>

                <CancelApplicationButton tuition={tuition} />
              </div>
            </div>
          </aside>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[16px] font-extrabold text-white">
              More tuitions like this
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {related.map((item) => (
                <TuitionCard key={item.id} tuition={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
