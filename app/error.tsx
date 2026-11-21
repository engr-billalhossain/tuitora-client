"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, TriangleAlert } from "lucide-react";

export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#050B0E] px-5 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1215] p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-400/10">
          <TriangleAlert className="h-7 w-7 text-rose-300" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-400">
          We could not load this page. Try again, or head back to the home page.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#B6F70B] text-[13px] font-bold text-black transition-colors hover:bg-[#C9FF42]"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 text-[13px] font-bold text-gray-200 transition-colors hover:border-[#B6F70B] hover:text-[#B6F70B]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
