"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Check,
  Crown,
  Sparkles,
  GraduationCap,
  Users,
  Zap,
  X,
} from "lucide-react"

import Footer from "@/components/Footre"

type Plan = {
  name: string
  badge: string
  price: string
  description: string
  features: string[]
  cta: string
  ctaHref: string
}

type MatrixRow = {
  feature: string
  free: string
  pro: string
  freeIncluded?: boolean
  proIncluded?: boolean
}

type Audience = "tutors" | "students"

const content: Record<
  Audience,
  { free: Plan; pro: Plan; matrix: MatrixRow[] }
> = {
  tutors: {
    free: {
      name: "Free Tutor",
      badge: "Free Forever",
      price: "$0",
      description:
        "Essential tools to test the platform and publish your initial tuitions.",
      features: [
        "Up to 2 tuition posts",
        "Standard tutor profile & bio",
        "Receive student application alerts",
        "Standard support",
      ],
      cta: "Get Started",
      ctaHref: "/sign-up",
    },
    pro: {
      name: "Pro Tutor",
      badge: "PRO",
      price: "$15",
      description:
        "Unlimited reach, verified credential badges, and prioritized tuition listings.",
      features: [
        "Unlimited tuition posts",
        "Golden Verified PRO badge",
        "Featured listings in search & homepage",
        "24/7 priority tutor support",
      ],
      cta: "Activate PRO Member",
      ctaHref: "/checkout?plan=tutor",
    },
    matrix: [
      {
        feature: "Tuition Post Limit",
        free: "2 Tuitions",
        pro: "Unlimited",
      },
      {
        feature: "Verified PRO Golden Badge",
        free: "No",
        pro: "Included",
        freeIncluded: false,
        proIncluded: true,
      },
      {
        feature: "Search Ranking Priority",
        free: "Standard",
        pro: "High Priority",
      },
      {
        feature: "Featured Homepage Listing",
        free: "No",
        pro: "Included",
        freeIncluded: false,
        proIncluded: true,
      },
      {
        feature: "Student Application Alerts",
        free: "Basic",
        pro: "Instant & Unlimited",
      },
      {
        feature: "Support",
        free: "Standard",
        pro: "24/7 Priority",
      },
    ],
  },
  students: {
    free: {
      name: "Free Student",
      badge: "Free Forever",
      price: "$0",
      description:
        "Everything you need to discover tutors and start your learning journey.",
      features: [
        "Browse up to 5 tutor bookmarks",
        "Standard tutor search",
        "Send basic tutor requests",
        "Standard support",
      ],
      cta: "Get Started",
      ctaHref: "/sign-up",
    },
    pro: {
      name: "Pro Student",
      badge: "PRO",
      price: "$10",
      description:
        "Unlock unlimited access, priority responses, and a verified PRO identity.",
      features: [
        "Unlimited tutor bookmarks",
        "Golden Verified PRO badge",
        "Priority response from tutors",
        "24/7 priority student support",
      ],
      cta: "Activate PRO Member",
      ctaHref: "/checkout?plan=student",
    },
    matrix: [
      {
        feature: "Bookmark Limit",
        free: "5 Bookmarks",
        pro: "Unlimited",
      },
      {
        feature: "Verified PRO Golden Badge",
        free: "No",
        pro: "Included",
        freeIncluded: false,
        proIncluded: true,
      },
      {
        feature: "Search Ranking",
        free: "Standard",
        pro: "Priority Results",
      },
      {
        feature: "Tutor Response Priority",
        free: "Standard",
        pro: "High Priority",
      },
      {
        feature: "Featured Tutor Recommendations",
        free: "No",
        pro: "Included",
        freeIncluded: false,
        proIncluded: true,
      },
      {
        feature: "Support",
        free: "Standard",
        pro: "24/7 Priority",
      },
    ],
  },
}

function PlanCard({
  plan,
  highlighted = false,
}: {
  plan: Plan
  highlighted?: boolean
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 sm:p-7 ${
        highlighted
          ? "border-[#B6F70B]/45 bg-[#0B1215] shadow-[0_0_40px_rgba(182,247,11,0.07)]"
          : "border-[#1E2A2E] bg-[#0B1215]"
      }`}
    >
      {/* Recommended ribbon */}
      {highlighted && (
        <span className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-[#B6F70B] px-3 py-1 text-[10px] font-extrabold tracking-wide text-black shadow-[0_0_18px_rgba(182,247,11,0.35)]">
          <Sparkles className="h-3 w-3" />
          RECOMMENDED
        </span>
      )}

      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${
            highlighted
              ? "border border-[#C9A227]/40 bg-[#C9A227]/10 text-[#E8C34A]"
              : "border border-white/15 bg-white/5 text-gray-300"
          }`}
        >
          {plan.badge}
        </span>
      </div>

      <p className="mb-5 min-h-[42px] text-[13px] leading-relaxed text-gray-400">
        {plan.description}
      </p>

      {/* Price */}
      <div className="mb-6 flex items-end gap-1">
        <span
          className={`text-4xl font-extrabold tracking-tight ${
            highlighted ? "text-[#B6F70B]" : "text-white"
          }`}
        >
          {plan.price}
        </span>
        <span className="pb-1 text-[13px] text-gray-400">/ month</span>
      </div>

      {/* Features */}
      <ul className="mb-7 flex flex-1 flex-col gap-3.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#B6F70B]" />
            <span className="text-[13px] text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={plan.ctaHref}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13px] font-bold transition-all duration-200 ${
          highlighted
            ? "bg-[#B6F70B] text-black hover:bg-[#C9FF42] hover:shadow-[0_0_20px_rgba(182,247,11,0.3)]"
            : "border border-white/20 text-white hover:border-[#B6F70B] hover:text-[#B6F70B]"
        }`}
      >
        {highlighted && <Crown className="h-4 w-4" />}
        {plan.cta}
      </Link>
    </div>
  )
}

export default function PricingPage() {
  const [audience, setAudience] = useState<Audience>("tutors")
  const data = content[audience]

  return (
    <main className="min-h-screen bg-[#050B0E] text-white">
      <div className="mx-auto max-w-[1100px] px-5 py-16 sm:px-8 sm:py-20">
        {/* HEADER */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#B6F70B]/40 bg-[#B6F70B]/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6F70B]">
            <Sparkles className="h-3 w-3" />
            Subscription Plans
          </span>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-[40px] sm:leading-tight">
            Simple, Transparent <span className="text-[#B6F70B]">Pricing</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[13px] leading-relaxed text-gray-400 sm:text-sm">
            Choose the right plan to power your tuition journey. Whether you
            are finding the best mentors or expanding your tutoring reach, we
            have you covered.
          </p>

          {/* TUTOR / STUDENT TOGGLE */}
          <div className="mt-8 inline-flex rounded-full border border-white/10 bg-[#0D1518] p-1">
            <button
              type="button"
              onClick={() => setAudience("tutors")}
              aria-pressed={audience === "tutors"}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold transition-all duration-200 ${
                audience === "tutors"
                  ? "border border-[#B6F70B]/30 bg-[#B6F70B]/15 text-[#B6F70B]"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              For Tutors
            </button>
            <button
              type="button"
              onClick={() => setAudience("students")}
              aria-pressed={audience === "students"}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold transition-all duration-200 ${
                audience === "students"
                  ? "border border-[#B6F70B]/30 bg-[#B6F70B]/15 text-[#B6F70B]"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Users className="h-4 w-4" />
              For Students
            </button>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="mx-auto mt-14 grid max-w-[760px] grid-cols-1 gap-6 md:grid-cols-2">
          <PlanCard plan={data.free} />
          <PlanCard plan={data.pro} highlighted />
        </div>

        {/* DIVIDER */}
        <div className="my-14 h-px w-full bg-[#1E2A2E]" />

        {/* FEATURE MATRIX */}
        <div className="mx-auto max-w-[860px] text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">
            Comprehensive Feature Matrix
          </h2>
          <p className="mt-2 text-[13px] text-gray-400">
            Compare our Free and PRO tiers side by side.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-[860px] overflow-hidden rounded-xl border border-[#1E2A2E] bg-[#0B1215]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="bg-[#111A1D] text-[11px] uppercase tracking-wider">
                  <th className="px-5 py-4 font-bold text-gray-300">Feature</th>
                  <th className="px-5 py-4 text-center font-bold text-gray-300">
                    Free Tier
                  </th>
                  <th className="px-5 py-4 text-center font-bold text-[#B6F70B]">
                    PRO Tier
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.matrix.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-t border-[#1E2A2E] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4 text-[13px] font-medium text-gray-200">
                      {row.feature}
                    </td>
                    <td className="px-5 py-4 text-center text-[13px] text-gray-400">
                      <span className="inline-flex items-center justify-center gap-1.5">
                        {row.freeIncluded === false && (
                          <X className="h-3.5 w-3.5 text-gray-600" />
                        )}
                        {row.free}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-[13px] font-semibold text-[#B6F70B]">
                      <span className="inline-flex items-center justify-center gap-1.5">
                        {row.proIncluded && (
                          <Check className="h-3.5 w-3.5 text-[#B6F70B]" />
                        )}
                        {row.pro}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mx-auto mt-8 flex max-w-fit items-center gap-2 text-center text-[12px] text-gray-500">
          <Zap className="h-3.5 w-3.5 text-[#B6F70B]" />
          Upgrade or downgrade your plan at any time.
        </p>
      </div>

      <Footer />
    </main>
  )
}
