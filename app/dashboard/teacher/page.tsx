"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  LayoutDashboard,
  Plus,
  Users,
} from "lucide-react";

import { StatsGrid, type StatItem } from "@/components/dashboard/DashboardStats";
import { useSession } from "@/lib/auth-client";
import type { Tuition } from "@/lib/actions/postTuitions";
import { isProValue } from "@/lib/plans";
import type { BookingRecord } from "@/lib/reviews";

export default function TeacherDashboardPage() {
  const { data: session } = useSession();
  const [tuitions, setTuitions] = React.useState<Tuition[]>([]);
  const [applicants, setApplicants] = React.useState<BookingRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;
    Promise.all([
      fetch("/api/tuitions?scope=mine", { cache: "no-store" }).then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          tuitions?: Tuition[];
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error || "Could not load your tuitions");
        return payload.tuitions ?? [];
      }),
      fetch("/api/bookings?scope=teacher", { cache: "no-store" }).then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          bookings?: BookingRecord[];
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error || "Could not load applicants");
        return payload.bookings ?? [];
      }),
    ])
      .then(([tuitionList, applicantList]) => {
        if (!active) return;
        setTuitions(tuitionList);
        setApplicants(applicantList);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Could not load dashboard data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const activeApproved = tuitions.filter(
    (item) => item.status === "approved" && item.isActive
  ).length;
  const isPro = isProValue(session?.user?.plan);

  const stats: StatItem[] = [
    {
      label: "Total Tuitions Posted",
      value: loading ? "—" : tuitions.length,
      icon: LayoutDashboard,
      hint: "Every batch you have created",
    },
    {
      label: "Active / Approved Tuitions",
      value: loading ? "—" : activeApproved,
      icon: CheckCircle2,
      hint: "Live in the public catalogue",
    },
    {
      label: "Total Applicants Received",
      value: loading ? "—" : applicants.length,
      icon: Users,
      hint: "Students who applied to you",
    },
    {
      label: "Current Plan",
      value: isPro ? "Pro" : "Free",
      icon: Crown,
      accent: isPro,
      hint: isPro ? "Unlimited posts" : "Up to 2 posts",
    },
  ];

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-[#080D0F] text-white sm:-mx-6 sm:-mt-6">
      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#B6F70B]/50 bg-[#B6F70B]/5">
              <LayoutDashboard className="h-5 w-5 text-[#B6F70B]" />
            </span>
            <div>
              <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-white">
                Tutor Dashboard
              </h1>
              <p className="mt-1.5 text-[11px] text-gray-500">
                Manage your tuitions, applicants and earnings.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/tutor/post-tuition"
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[#B6F70B] px-4 text-[11px] font-bold text-black transition-colors hover:bg-[#C9FF42]"
          >
            <Plus className="h-3.5 w-3.5" /> Post Tuition
          </Link>
        </div>

        <div className="mt-6">
          <StatsGrid items={stats} />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "My Tuitions",
              description: "Edit, delete or toggle your batches.",
              href: "/dashboard/tutor/my-tuitions",
              cta: "Manage tuitions",
            },
            {
              title: "Applicants",
              description: "Accept or reject student requests.",
              href: "/dashboard/tutor/applicants",
              cta: "Review applicants",
            },
            {
              title: "Upgrade to PRO",
              description: isPro
                ? "You already have unlimited posts and a verified badge."
                : "Post unlimited batches with a verified badge.",
              href: "/pricing",
              cta: "View plans",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="flex h-full flex-col rounded-2xl border border-white/[0.07] bg-[#10191D] p-5"
            >
              <h2 className="text-[14px] font-extrabold text-white">{card.title}</h2>
              <p className="mt-2 flex-1 text-[12px] leading-relaxed text-gray-400">
                {card.description}
              </p>
              <Link
                href={card.href}
                className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#B6F70B] hover:text-[#C9FF42]"
              >
                {card.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
