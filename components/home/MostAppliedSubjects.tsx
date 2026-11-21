"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SubjectIconTile } from "@/components/tuitions/SubjectIcon";
import {
  getBookings,
  getTuitions,
} from "@/lib/actions/postTuitions";
import { iconForSubject } from "@/lib/tuitions";

type SubjectCount = { subject: string; count: number };

export function MostAppliedSubjects() {
  const [subjects, setSubjects] = React.useState<SubjectCount[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    Promise.all([getBookings(), getTuitions("approved")])
      .then(([bookings, tuitions]) => {
        if (!active) return;
        const subjectById = new Map(tuitions.map((item) => [item.id, item.subject]));
        const counts = new Map<string, number>();
        for (const booking of bookings) {
          const subject = subjectById.get(booking.tuitionId);
          if (!subject) continue;
          counts.set(subject, (counts.get(subject) ?? 0) + 1);
        }
        const ranked = Array.from(counts, ([subject, count]) => ({ subject, count }))
          .sort((a, b) => b.count - a.count || a.subject.localeCompare(b.subject))
          .slice(0, 6);

        // Keep the popular categories visible even before the first application.
        setSubjects(
          ranked.length > 0
            ? ranked
            : [
                { subject: "Mathematics", count: 0 },
                { subject: "Physics", count: 0 },
                { subject: "ICT / Programming", count: 0 },
                { subject: "IELTS & Spoken English", count: 0 },
              ]
        );
      })
      .catch((error) => {
        console.error("Failed to load applied subjects:", error);
        if (active) toast.error("Could not load popular subjects.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const max = subjects[0]?.count ?? 1;

  return (
    <section className="w-full bg-[#080D0F] px-6 py-10 text-white sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-[#B6F70B] uppercase">
              <TrendingUp className="h-4 w-4" />
              What students are learning
            </div>
            <h2 className="mt-2 text-[22px] font-extrabold tracking-tight sm:text-[26px]">
              Most Applied Subjects
            </h2>
            <p className="mt-1.5 text-[12px] text-gray-400">
              Based on real tuition applications from students like you.
            </p>
          </div>
          <Link
            href="/tuitions"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#B6F70B] transition-colors hover:text-[#C9FF42]"
          >
            Explore all subjects <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-[92px] animate-pulse rounded-2xl bg-[#10191D]"
              />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <Card className="mt-6 rounded-2xl border border-dashed border-white/10 bg-[#0D1417] py-0 shadow-none">
            <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
              <Users className="h-6 w-6 text-[#B6F70B]" />
              <p className="text-[13px] font-extrabold text-white">
                No applications yet
              </p>
              <p className="text-[11px] text-gray-500">
                Subjects will appear here as students apply for tuition.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((item, index) => (
              <Link
                key={item.subject}
                href={`/tuitions?search=${encodeURIComponent(item.subject)}`}
                className="group rounded-2xl border border-white/[0.07] bg-[#10191D] p-4 transition-colors hover:border-[#B6F70B]/40"
              >
                <div className="flex items-center gap-3">
                  <SubjectIconTile
                    icon={iconForSubject(item.subject)}
                    className="h-10 w-10"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-extrabold text-white">
                        {item.subject}
                      </p>
                      <Badge className="border-[#B6F70B]/25 bg-[#B6F70B]/10 text-[10px] font-bold text-[#B6F70B]">
                        #{index + 1}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] font-semibold text-gray-500">
                      {item.count} application{item.count === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-[#B6F70B] transition-all group-hover:bg-[#C9FF42]"
                    style={{ width: `${Math.max(12, (item.count / max) * 100)}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
