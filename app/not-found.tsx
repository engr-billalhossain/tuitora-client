import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#050B0E] px-5 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1215] p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#B6F70B]/25 bg-[#B6F70B]/10">
          <Compass className="h-7 w-7 text-[#B6F70B]" />
        </span>
        <p className="mt-5 text-[11px] font-extrabold tracking-[0.2em] text-[#B6F70B] uppercase">
          404
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Page not found</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-400">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#B6F70B] text-[13px] font-bold text-black transition-colors hover:bg-[#C9FF42]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </div>
    </main>
  );
}
