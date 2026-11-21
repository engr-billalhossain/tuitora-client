import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardList,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const steps: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Search,
    title: "Find the right batch",
    description:
      "Search approved tuitions by subject, class level and mode, then compare tutors, schedules and fees.",
  },
  {
    icon: ClipboardList,
    title: "Apply in one click",
    description:
      "Pick a time slot, add a short learning note and send your application. Tutors review every request.",
  },
  {
    icon: BookOpenCheck,
    title: "Start learning",
    description:
      "Once accepted, join online or offline classes and track all your applications from your dashboard.",
  },
  {
    icon: Sparkles,
    title: "Teach & grow",
    description:
      "Tutors post batches, manage applicants and upgrade to PRO for unlimited posts and a verified badge.",
  },
];

export function HowItWorks() {
  return (
    <section className="fade-up w-full border-t border-white/[0.05] bg-[#0B1215] px-6 py-12 text-white sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-wide text-[#B6F70B] uppercase">
            <Sparkles className="h-4 w-4" />
            Simple by design
          </div>
          <h2 className="mt-2 text-[22px] font-extrabold tracking-tight sm:text-[26px]">
            How MentorLagbe Works
          </h2>
          <p className="mt-1.5 text-[12px] text-gray-400">
            From search to your first class in four straightforward steps.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative flex h-full flex-col rounded-2xl border border-white/[0.07] bg-[#10191D] p-5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#B6F70B]/25 bg-[#B6F70B]/10 text-[#B6F70B]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-4 text-[11px] font-extrabold tracking-wide text-[#B6F70B]">
                  STEP {index + 1}
                </span>
                <h3 className="mt-1 text-[15px] font-extrabold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-[12px] leading-relaxed text-gray-400">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/how-it-works"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#B6F70B] px-6 text-[12px] font-bold text-black transition-colors hover:bg-[#C9FF42]"
          >
            See the full guide <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
