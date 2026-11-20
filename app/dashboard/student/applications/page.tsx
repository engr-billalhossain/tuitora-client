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
  UserRound,
} from "lucide-react";

import {
  APPLICATIONS_CHANGED_EVENT,
  readApplications,
  type BookingApplication,
} from "@/lib/tuitions";

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

export default function StudentApplicationsPage() {
  const applications = useApplications();

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
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Request sent
                    </span>
                  </div>

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
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
