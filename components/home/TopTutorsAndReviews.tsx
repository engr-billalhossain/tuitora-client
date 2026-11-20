"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  MessageSquareQuote,
  Quote,
  Star,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TutorAvatar } from "@/components/tuitions/TutorAvatar";
import { getReviews, type Review } from "@/lib/reviews";
import { cn } from "@/lib/utils";

type TutorStat = {
  key: string;
  name: string;
  image?: string;
  subjects: string[];
  average: number;
  count: number;
  latest: string;
};

function aggregateTutors(reviews: Review[]): TutorStat[] {
  const map = new Map<string, TutorStat & { total: number }>();

  for (const review of reviews) {
    const key = review.tutorId || `name:${review.tutorName}`;
    const current = map.get(key);
    if (current) {
      current.total += review.rating;
      current.count += 1;
      current.average = current.total / current.count;
      if (review.subject && !current.subjects.includes(review.subject)) {
        current.subjects.push(review.subject);
      }
      if (review.createdAt > current.latest) current.latest = review.createdAt;
    } else {
      map.set(key, {
        key,
        name: review.tutorName || "Tutor",
        image: review.tutorImage,
        subjects: review.subject ? [review.subject] : [],
        total: review.rating,
        average: review.rating,
        count: 1,
        latest: review.createdAt,
      });
    }
  }

  return Array.from(map.values())
    .map((item) => ({
      key: item.key,
      name: item.name,
      image: item.image,
      subjects: item.subjects,
      average: item.total / item.count,
      count: item.count,
      latest: item.latest,
    }))
    .sort(
      (a, b) =>
        b.average - a.average ||
        b.count - a.count ||
        b.latest.localeCompare(a.latest)
    )
    .slice(0, 6);
}

function Stars({ value, size = "h-3 w-3" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-600"
          }`}
        />
      ))}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function TopTutorsAndReviews() {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    getReviews()
      .then((list) => {
        if (active) setReviews(list);
      })
      .catch((error) => console.error("Failed to load reviews:", error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const tutors = aggregateTutors(reviews);
  const bestReviews = [...reviews]
    .sort(
      (a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt)
    )
    .slice(0, 4);

  return (
    <section className="w-full border-t border-white/[0.05] bg-[#0B1215] px-6 py-10 text-white sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-[#B6F70B] uppercase">
              <Trophy className="h-4 w-4" />
              Rated by students
            </div>
            <h2 className="mt-2 text-[22px] font-extrabold tracking-tight sm:text-[26px]">
              Top 6 Tutors
            </h2>
            <p className="mt-1.5 text-[12px] text-gray-400">
              Ranked by real reviews from students who joined their courses.
            </p>
          </div>
          <Link
            href="/tuitions"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 rounded-full border-[#B6F70B]/50 bg-transparent px-4 text-[11px] font-bold text-[#B6F70B] hover:bg-[#B6F70B]/10 hover:text-[#C9FF42]"
            )}
          >
            Find a tutor <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="h-[420px] animate-pulse rounded-2xl bg-[#10191D]" />
            <div className="h-[300px] animate-pulse rounded-2xl bg-[#10191D]" />
          </div>
        ) : tutors.length === 0 ? (
          <Card className="mt-6 rounded-2xl border border-dashed border-white/10 bg-[#0D1417] py-0 shadow-none">
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#B6F70B]/20 bg-[#B6F70B]/5">
                <Star className="h-6 w-6 text-[#B6F70B]" />
              </span>
              <p className="text-[14px] font-extrabold text-white">No reviews yet</p>
              <p className="max-w-md text-[12px] text-gray-500">
                Once students review the tutors who added them to a course, the
                top tutors and their best reviews will appear right here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
            {/* Top tutors */}
            <Card className="rounded-2xl border-white/[0.07] bg-[#10191D] py-0 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[13px] font-extrabold text-white">
                  <BadgeCheck className="h-4 w-4 text-[#B6F70B]" />
                  Highest rated tutors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 px-4 pb-4 sm:px-5">
                {tutors.map((tutor, index) => (
                  <div key={tutor.key}>
                    <div className="flex items-center gap-3 rounded-xl px-1 py-3 transition-colors hover:bg-white/[0.03]">
                      <span
                        className={`w-5 shrink-0 text-center text-[13px] font-extrabold ${
                          index === 0 ? "text-[#B6F70B]" : "text-gray-600"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <TutorAvatar
                        name={tutor.name}
                        src={tutor.image}
                        className="h-10 w-10 text-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-extrabold text-white">
                          {tutor.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5">
                          <Stars value={tutor.average} />
                          <span className="text-[10px] font-bold text-amber-300">
                            {tutor.average.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            ({tutor.count} review{tutor.count === 1 ? "" : "s"})
                          </span>
                        </p>
                      </div>
                      <div className="hidden max-w-[190px] flex-wrap justify-end gap-1 sm:flex">
                        {tutor.subjects.slice(0, 2).map((subject) => (
                          <Badge
                            key={subject}
                            variant="secondary"
                            className="border-white/10 bg-white/[0.05] text-[9px] font-semibold text-gray-300"
                          >
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {index < tutors.length - 1 && (
                      <Separator className="bg-white/[0.05]" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Best student reviews — sidebar */}
            <Card className="rounded-2xl border-white/[0.07] bg-[#10191D] py-0 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[13px] font-extrabold text-white">
                  <MessageSquareQuote className="h-4 w-4 text-[#B6F70B]" />
                  Student Reviews
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 sm:px-5">
                {bestReviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-xl border border-white/[0.06] bg-[#0D1417] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Stars value={review.rating} />
                      <Quote className="h-3.5 w-3.5 text-[#B6F70B]/50" />
                    </div>
                    <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-gray-300">
                      “{review.comment}”
                    </p>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <p className="truncate text-[10px] font-bold text-white">
                        {review.studentName}
                      </p>
                      <p className="shrink-0 text-[9px] text-gray-500">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-[9px] font-semibold text-[#B6F70B]">
                      for {review.tutorName}
                      {review.subject ? ` · ${review.subject}` : ""}
                    </p>
                  </article>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
