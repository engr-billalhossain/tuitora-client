"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Crown,
  FileText,
  GraduationCap,
} from "lucide-react";

import { StatsGrid, type StatItem } from "@/components/dashboard/DashboardStats";
import { useSession } from "@/lib/auth-client";
import { isProValue } from "@/lib/plans";
import type { BookingRecord } from "@/lib/reviews";

export default function StudentDashboardPage() {
  const { data: session } = useSession();
  const [applications, setApplications] = React.useState<BookingRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;
    fetch("/api/bookings?scope=mine", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          bookings?: BookingRecord[];
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error || "Could not load applications");
        if (active) setApplications(payload.bookings ?? []);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Could not load applications");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const accepted = applications.filter((item) => item.status === "accepted").length;
  const pending = applications.filter((item) => item.status === "pending").length;
  const isPro = isProValue(session?.user?.plan);

  const stats: StatItem[] = [
    {
      label: "Total Applied Tuitions",
      value: loading ? "—" : applications.length,
      icon: FileText,
      hint: "All of your submitted applications",
    },
    {
      label: "Accepted Applications",
      value: loading ? "—" : accepted,
      icon: CheckCircle2,
      hint: "Batches you have joined",
    },
    {
      label: "Pending Applications",
      value: loading ? "—" : pending,
      icon: Clock3,
      hint: "Awaiting a tutor response",
    },
    {
      label: "Current Plan",
      value: isPro ? "Pro" : "Free",
      icon: Crown,
      accent: isPro,
      hint: isPro ? "Unlimited applications" : "Up to 5 applications",
    },
  ];

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-[#080D0F] text-white sm:-mx-6 sm:-mt-6">
      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#B6F70B]/50 bg-[#B6F70B]/5">
              <GraduationCap className="h-5 w-5 text-[#B6F70B]" />
            </span>
            <div>
              <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-white">
                Student Dashboard
              </h1>
              <p className="mt-1.5 text-[11px] text-gray-500">
                Find tuitions, track applications and save bookmarks.
              </p>
            </div>
          </div>
          <Link
            href="/tuitions"
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[#B6F70B] px-4 text-[11px] font-bold text-black transition-colors hover:bg-[#C9FF42]"
          >
            Find Tuitions <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6">
          <StatsGrid items={stats} />
        </div>

        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#10191D] p-6">
          <h2 className="text-[15px] font-extrabold text-white">Pick up where you left off</h2>
          <p className="mt-1 text-[12px] text-gray-400">
            Browse the latest approved batches or review the applications you have already sent.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/tuitions"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#B6F70B] px-5 text-[12px] font-bold text-black transition-colors hover:bg-[#C9FF42]"
            >
              Browse Tuitions
            </Link>
            <Link
              href="/dashboard/student/my-applications"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-5 text-[12px] font-bold text-gray-200 transition-colors hover:border-[#B6F70B] hover:text-[#B6F70B]"
            >
              My Applications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
