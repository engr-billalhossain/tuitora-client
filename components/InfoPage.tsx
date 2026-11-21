import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

import Footer from "@/components/Footre";

type Section = { heading: string; body: string };

export type InfoPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  icon: LucideIcon;
  sections: Section[];
};

/** Shared, consistent layout for the static informational pages. */
export function InfoPage({ eyebrow, title, intro, icon: Icon, sections }: InfoPageProps) {
  return (
    <div className="min-h-screen bg-[#050B0E] text-white">
      <main className="mx-auto max-w-[900px] px-5 py-14 sm:px-8 sm:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[12px] font-semibold text-gray-400 transition-colors hover:text-[#B6F70B]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="mt-8 flex items-center gap-2 text-[11px] font-bold tracking-wide text-[#B6F70B] uppercase">
          <Icon className="h-4 w-4" />
          {eyebrow}
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-[40px]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-gray-400">
          {intro}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.heading}
              className="rounded-2xl border border-white/[0.07] bg-[#0B1215] p-6"
            >
              <h2 className="text-[15px] font-extrabold text-white">
                {section.heading}
              </h2>
              <p className="mt-2 text-[12px] leading-[1.8] text-gray-400">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-[#B6F70B]/25 bg-[#B6F70B]/5 p-6 text-center">
          <h2 className="text-[16px] font-extrabold text-white">
            Ready to find your next tutor?
          </h2>
          <p className="mt-1 text-[12px] text-gray-400">
            Browse hundreds of admin-approved tuitions across every subject.
          </p>
          <Link
            href="/tuitions"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#B6F70B] px-6 text-[12px] font-bold text-black transition-colors hover:bg-[#C9FF42]"
          >
            Browse Tuitions
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
