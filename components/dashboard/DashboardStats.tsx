"use client";

import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatItem = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  accent?: boolean;
};

/** Shared stat card used by every role's overview page. */
export function StatCard({ item }: { item: StatItem }) {
  const Icon = item.icon;
  return (
    <Card className="gap-0 rounded-2xl border border-white/[0.07] bg-[#11181B] py-0 text-white shadow-none ring-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border",
              item.accent
                ? "border-[#C9A227]/40 bg-[#C9A227]/10 text-[#E8C34A]"
                : "border-[#B6F70B]/25 bg-[#B6F70B]/10 text-[#B6F70B]"
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <p className="mt-4 text-[12px] font-medium text-gray-400">{item.label}</p>
        <p className="mt-1 text-[26px] leading-tight font-extrabold tracking-tight text-white">
          {item.value}
        </p>
        {item.hint && (
          <p className="mt-1 text-[10px] font-semibold text-gray-500">{item.hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsGrid({ items }: { items: StatItem[] }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatCard key={item.label} item={item} />
      ))}
    </section>
  );
}
