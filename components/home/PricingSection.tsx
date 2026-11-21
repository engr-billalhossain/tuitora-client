import Link from "next/link";
import { Check, Crown, GraduationCap, Sparkles, Users } from "lucide-react";

import { PRO_PLANS } from "@/lib/plans";

const groups = [
  {
    audience: "For Tutors",
    icon: GraduationCap,
    plans: [
      {
        name: "Free Tutor",
        price: "$0",
        features: ["Up to 2 tuition posts", "Student application alerts", "Standard support"],
        cta: "Get Started",
        href: "/sign-up",
        pro: false,
      },
      {
        name: "Pro Tutor",
        price: `$${(PRO_PLANS.tutor.amount / 100).toFixed(0)}`,
        features: [
          "Unlimited tuition posts",
          "Verified PRO badge",
          "Featured listings & priority support",
        ],
        cta: "Subscribe with Stripe",
        href: "/checkout?plan=tutor",
        pro: true,
      },
    ],
  },
  {
    audience: "For Students",
    icon: Users,
    plans: [
      {
        name: "Free Student",
        price: "$0",
        features: ["Browse all tuitions", "Apply to up to 5 tuitions", "Standard support"],
        cta: "Get Started",
        href: "/sign-up",
        pro: false,
      },
      {
        name: "Pro Student",
        price: `$${(PRO_PLANS.student.amount / 100).toFixed(0)}`,
        features: [
          "Unlimited applications",
          "Verified PRO badge",
          "Priority tutor responses",
        ],
        cta: "Subscribe with Stripe",
        href: "/checkout?plan=student",
        pro: true,
      },
    ],
  },
];

export function PricingSection() {
  return (
    <section className="fade-up w-full border-t border-white/[0.05] bg-[#080D0F] px-6 py-12 text-white sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-wide text-[#B6F70B] uppercase">
            <Sparkles className="h-4 w-4" />
            Simple, transparent pricing
          </div>
          <h2 className="mt-2 text-[22px] font-extrabold tracking-tight sm:text-[26px]">
            Choose the Plan That Fits You
          </h2>
          <p className="mt-1.5 text-[12px] text-gray-400">
            Free forever for getting started. Upgrade to PRO for more reach and priority.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.audience} className="rounded-2xl border border-white/[0.07] bg-[#0B1215] p-5">
                <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-white">
                  <Icon className="h-4 w-4 text-[#B6F70B]" />
                  {group.audience}
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {group.plans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`flex h-full flex-col rounded-xl border p-4 ${
                        plan.pro
                          ? "border-[#B6F70B]/40 bg-[#B6F70B]/[0.04]"
                          : "border-white/[0.07] bg-[#10191D]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[13px] font-extrabold text-white">{plan.name}</h4>
                        {plan.pro && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-2 py-0.5 text-[9px] font-bold text-[#E8C34A]">
                            <Crown className="h-2.5 w-2.5" /> PRO
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-2xl font-extrabold text-[#B6F70B]">
                        {plan.price}
                        <span className="ml-1 text-[11px] font-semibold text-gray-500">/ month</span>
                      </p>
                      <ul className="mt-3 flex-1 space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-[11px] text-gray-300">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B6F70B]" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={plan.href}
                        className={`mt-4 inline-flex h-9 w-full items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                          plan.pro
                            ? "bg-[#B6F70B] text-black hover:bg-[#C9FF42]"
                            : "border border-white/15 text-gray-200 hover:border-[#B6F70B] hover:text-[#B6F70B]"
                        }`}
                      >
                        {plan.cta}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/pricing"
            className="inline-flex text-[11px] font-bold text-[#B6F70B] transition-colors hover:text-[#C9FF42]"
          >
            Compare every feature on the pricing page →
          </Link>
        </div>
      </div>
    </section>
  );
}
