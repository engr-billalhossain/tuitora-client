"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  DollarSign,
  GraduationCap,
  Layers3,
  MapPin,
  Monitor,
  Sparkles,
  UserRound,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubjectIconTile } from "@/components/tuitions/SubjectIcon";
import { getTuitions, type Tuition } from "@/lib/actions/postTuitions";
import { iconForSubject } from "@/lib/tuitions";
import { cn } from "@/lib/utils";

/**
 * Home-page showcase: the six newest approved AND active tuitions.
 * Cards use a fixed grid so every card keeps the same height and width.
 */
export function FeaturedTuitions() {
  const [tuitions, setTuitions] = React.useState<Tuition[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    getTuitions("approved")
      .then((list) => {
        if (!active) return;
        const visible = list
          .filter((item) => item.isActive !== false)
          .sort(
            (a, b) =>
              new Date(b.createdAt ?? 0).getTime() -
              new Date(a.createdAt ?? 0).getTime()
          )
          .slice(0, 6);
        setTuitions(visible);
      })
      .catch((error) => console.error("Failed to load featured tuitions:", error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="fade-up w-full bg-[#080D0F] px-6 py-12 text-white sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-[#B6F70B] uppercase">
              <Sparkles className="h-4 w-4" />
              Hand-picked for you
            </div>
            <h2 className="mt-2 text-[22px] font-extrabold tracking-tight sm:text-[26px]">
              Featured Tuitions
            </h2>
            <p className="mt-1.5 text-[12px] text-gray-400">
              The latest admin-approved batches from verified tutors.
            </p>
          </div>
          <Link
            href="/tuitions"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 rounded-full border-[#B6F70B]/50 bg-transparent px-4 text-[11px] font-bold text-[#B6F70B] hover:bg-[#B6F70B]/10 hover:text-[#C9FF42]"
            )}
          >
            Browse all tuitions <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-[290px] animate-pulse rounded-2xl bg-[#10191D]"
              />
            ))}
          </div>
        ) : tuitions.length === 0 ? (
          <Card className="mt-6 rounded-2xl border border-dashed border-white/10 bg-[#0D1417] py-0 shadow-none">
            <CardContent className="p-10 text-center text-[12px] text-gray-500">
              No approved tuitions yet. Check back soon!
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tuitions.map((tuition) => (
              <article
                key={tuition.id}
                className="flex h-full min-h-[290px] flex-col rounded-2xl border border-white/[0.07] bg-[#10191D] p-5 transition-colors duration-300 hover:border-[#B6F70B]/40"
              >
                <div className="flex items-start gap-3">
                  <SubjectIconTile
                    icon={iconForSubject(tuition.subject)}
                    className="h-11 w-11 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="inline-flex rounded-md border border-[#B6F70B]/25 bg-[#B6F70B]/10 px-2 py-0.5 text-[10px] font-bold text-[#B6F70B]">
                      {tuition.mode}
                    </span>
                    <h3 className="mt-1.5 line-clamp-2 text-[15px] leading-snug font-extrabold text-white">
                      {tuition.title}
                    </h3>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-[11px] font-semibold text-gray-400">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0 text-[#B6F70B]" />
                    {tuition.subject}
                  </span>
                  <span className="flex items-center gap-2">
                    <Layers3 className="h-3.5 w-3.5 shrink-0 text-[#B6F70B]" />
                    {tuition.classLevel}
                  </span>
                  <span className="flex items-center gap-2">
                    {tuition.mode.toLowerCase() === "online" ? (
                      <Monitor className="h-3.5 w-3.5 shrink-0 text-[#B6F70B]" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#B6F70B]" />
                    )}
                    {tuition.mode}
                    {tuition.location ? ` · ${tuition.location}` : ""}
                  </span>
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#B6F70B]" />
                    {tuition.days} / week
                  </span>
                </div>

                <div className="mt-auto border-t border-white/[0.06] pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold text-gray-300">
                      <UserRound className="h-3.5 w-3.5 shrink-0 text-[#B6F70B]" />
                      <span className="truncate">{tuition.tutorName || "Tutor"}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[13px] font-extrabold text-[#B6F70B]">
                      <DollarSign className="h-3.5 w-3.5" />
                      {tuition.monthlyFee || tuition.fee}
                      <span className="text-[10px] font-semibold text-gray-500">/mo</span>
                    </span>
                  </div>
                  <Link
                    href={`/tuitions/${tuition.id}`}
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-[#B6F70B] text-[12px] font-bold text-black transition-colors hover:bg-[#C9FF42]"
                  >
                    View Details <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
