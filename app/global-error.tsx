"use client";

import "./globals.css";

import Link from "next/link";
import { RefreshCw } from "lucide-react";

/** Last-resort boundary for errors thrown in the root layout itself. */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050B0E] text-white">
        <main className="flex min-h-screen items-center justify-center px-5">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1215] p-8 text-center">
            <h1 className="text-2xl font-extrabold">Something went wrong</h1>
            <p className="mt-2 text-[13px] text-gray-400">
              {error instanceof Error ? error.message : "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={() => retry()}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#B6F70B] text-[13px] font-bold text-black"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
            <Link
              href="/"
              className="mt-3 inline-block text-[12px] font-semibold text-[#B6F70B] hover:underline"
            >
              Back to Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
