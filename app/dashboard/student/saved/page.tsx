"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, Loader2, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

import {
  FAVORITES_CHANGED_EVENT,
  getBrowseData,
  readFavorites,
  syncFavoritesFromServer,
} from "@/lib/tuitions";
import { TuitionCard } from "@/components/tuitions/TuitionCard";
import type { BrowseTuition } from "@/lib/tuitions";

export default function SavedTuitionsPage() {
  const [tuitions, setTuitions] = React.useState<BrowseTuition[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    let active = true;
    syncFavoritesFromServer()
      .catch(() => {
        if (active) toast.error("Could not sync your saved tuitions.");
      })
      .then(() => {
        const ids = new Set(readFavorites());
        getBrowseData()
          .then((result) => {
            if (active) setTuitions(result.tuitions.filter((item) => ids.has(item.id)));
          })
          .catch(() => {
            if (active) {
              setTuitions([]);
              toast.error("Could not load your saved tuitions.");
            }
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      });
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    const cleanup = load();
    window.addEventListener(FAVORITES_CHANGED_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      cleanup();
      window.removeEventListener(FAVORITES_CHANGED_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, [load]);

  return (
    <main className="min-h-[80vh] px-4 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#78B900] uppercase dark:text-[#B6F70B]">
            Your collection
          </p>
          <h1 className="mt-1 text-2xl font-extrabold">Saved Tuitions</h1>
          <p className="mt-1 text-[12px] text-[#5A666B] dark:text-gray-400">
            Bookmarked listings are stored in your account, so they follow you
            across devices.
          </p>
        </div>
        <Link
          href="/tuitions"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#B6F70B] px-5 text-[12px] font-extrabold text-[#0B1100] transition-colors hover:bg-[#C9FF42]"
        >
          <Search className="h-4 w-4" /> Browse more
        </Link>
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#78B900] dark:text-[#B6F70B]" />
        </div>
      ) : tuitions.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#0B1100]/15 bg-white px-6 py-20 text-center dark:border-white/10 dark:bg-[#10191D]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#B6F70B]/20 bg-[#B6F70B]/5">
            <Bookmark className="h-6 w-6 text-[#78B900] dark:text-[#B6F70B]" />
          </span>
          <h2 className="mt-4 text-[15px] font-extrabold">Nothing saved yet</h2>
          <p className="mt-1.5 max-w-sm text-[12px] text-[#5A666B] dark:text-gray-500">
            Tap the heart on any tuition to keep it here for later.
          </p>
          <Link
            href="/tuitions"
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-[#B6F70B] px-4 text-[11px] font-extrabold text-[#0B1100]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Find tuitions
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tuitions.map((tuition) => (
            <TuitionCard key={tuition.id} tuition={tuition} />
          ))}
        </div>
      )}
    </main>
  );
}
