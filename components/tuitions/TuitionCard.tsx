"use client";

import Link from "next/link";
import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Clock3,
  DollarSign,
  Eye,
  GraduationCap,
  MapPin,
  Star,
  UsersRound,
  Video,
} from "lucide-react";

import { type BrowseTuition } from "@/lib/tuitions";
import { cn } from "@/lib/utils";
import { BookButton } from "@/components/tuitions/BookButton";
import { TutorAvatar } from "@/components/tuitions/TutorAvatar";

const chipClass =
  "inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1.5 text-[12px] font-semibold text-gray-300";

export function TuitionCard({
  tuition,
  view = "grid",
}: {
  tuition: BrowseTuition;
  view?: "grid" | "list";
}) {
  const isOnline = tuition.mode.toLowerCase() === "online";
  const firstSlot = tuition.availableSlots[0];

  return (
    <article
      className={cn(
        "group relative isolate overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0D1518] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.28)] transition-colors duration-300 hover:border-[#F5B849]/30"
      )}
    >
      {/* Golden crescent accents in the top-right corner */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-16 -right-24 h-36 w-64 -rotate-12 rounded-[50%] border-t border-[#F5B849]/20"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-20 -right-28 h-36 w-64 -rotate-12 rounded-[50%] border-t border-[#F5B849]/10"
      />

      <div className="relative z-10">
        {/* Tutor row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <TutorAvatar
              name={tuition.tutorName}
              src={tuition.tutorImage}
              className="h-12 w-12 shrink-0 text-sm"
            />
            <span aria-hidden className="h-10 w-px shrink-0 bg-white/10" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-[17px] leading-tight font-extrabold text-white">
                {tuition.tutorName}
                {tuition.verified && (
                  <BadgeCheck
                    className="h-4 w-4 shrink-0 text-[#B6F70B]"
                    aria-label="Verified tutor"
                  />
                )}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[13px] font-medium text-gray-500">
                {tuition.rating !== null ? (
                  <>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-amber-300">
                      {tuition.rating.toFixed(1)}
                    </span>
                    {tuition.reviews > 0 && (
                      <span className="text-gray-500">
                        ({tuition.reviews} reviews)
                      </span>
                    )}
                  </>
                ) : (
                  <span>New tutor</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mt-4 flex items-start gap-2.5">
          <span aria-hidden className="mt-1.5 h-5 w-1 shrink-0 rounded-full bg-[#F5B849]" />
          <Link
            href={`/tuitions/${tuition.id}`}
            className="line-clamp-2 text-[22px] leading-tight font-extrabold text-white transition-colors hover:text-[#F5B849]"
          >
            {tuition.title}
          </Link>
        </div>

        {/* Subject / class chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={chipClass}>
            <GraduationCap className="h-[18px] w-[18px] text-gray-400" />
            {tuition.classLevel}
          </span>
          <span className={chipClass}>
            <BookOpen className="h-[18px] w-[18px] text-gray-400" />
            {tuition.subject}
          </span>
          {view === "list" && tuition.description && (
            <p className="w-full line-clamp-2 text-[12px] leading-relaxed text-gray-500">
              {tuition.description}
            </p>
          )}
        </div>

        {/* Mode / days / fee */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold",
              isOnline
                ? "border-sky-400/25 bg-sky-400/[0.07] text-sky-300"
                : "border-violet-400/25 bg-violet-400/[0.07] text-violet-300"
            )}
          >
            {isOnline ? (
              <Video className="h-[18px] w-[18px]" />
            ) : (
              <MapPin className="h-[18px] w-[18px]" />
            )}
            {isOnline ? "Online" : "Offline"}
          </span>
          <span aria-hidden className="h-5 w-px bg-white/10" />
          <span className={chipClass}>
            <CalendarDays className="h-[18px] w-[18px] text-gray-400" />
            {tuition.days}
          </span>
          <span aria-hidden className="h-5 w-px bg-white/10" />
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#F5B849]/15 bg-[#F5B849]/[0.07] px-2.5 py-1.5 text-[12px] font-bold text-[#F5B849]">
            <DollarSign className="h-[18px] w-[18px]" />${tuition.fee}
            <span className="font-medium text-[#F5B849]/70">/ month</span>
          </span>
          {!isOnline && (
            <span className="text-[12px] text-gray-500">{tuition.location}</span>
          )}
        </div>

        <div className="my-3 h-px bg-white/[0.08]" />

        {/* Slot summary */}
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[13px] font-bold text-gray-300">
            <UsersRound className="h-[18px] w-[18px] text-violet-400" />
            {tuition.availableSlots.length} slots open
          </span>
          <span aria-hidden className="h-5 w-px bg-white/10" />
          <span className="flex items-center gap-2 text-[13px] font-bold text-white">
            <Clock3 className="h-[18px] w-[18px] text-violet-400" />
            {firstSlot ? `${firstSlot.start} – ${firstSlot.end}` : "No slots"}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2.5">
          <Link
            href={`/tuitions/${tuition.id}`}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] text-[13px] font-bold text-gray-200 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            <Eye className="h-[18px] w-[18px]" />
            View Details
          </Link>
          <BookButton tuition={tuition} className="flex-[1.35]" />
        </div>
      </div>
    </article>
  );
}
