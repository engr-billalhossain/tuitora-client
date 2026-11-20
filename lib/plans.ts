/* ==========================================================================
   Shared plan configuration.

   This module is safe to import from both server and client code. It contains
   NO secrets. Prices live here on the server side only in the sense that the
   browser never sends an amount — the API always derives it from this file.
   ========================================================================== */

export const PLAN_FREE = "free" as const;
export const PLAN_PRO = "pro" as const;

export type ProPlan = "tutor" | "student";

export type ProPlanPrice = {
  amount: number; // in the smallest currency unit (cents for USD)
  currency: string;
  label: string;
};

/**
 * Keep these amounts in sync with app/pricing/page.tsx.
 * A one-time payment unlocks PRO for the paying account (tutor or student).
 */
export const PRO_PLANS: Record<ProPlan, ProPlanPrice> = {
  tutor: { amount: 1500, currency: "usd", label: "Pro Tutor" },
  student: { amount: 1000, currency: "usd", label: "Pro Student" },
};

/** Stripe metadata marker so only OUR payment intents can ever grant PRO. */
export const PRO_PURPOSE = "tuitora_pro_upgrade";

export function isProPlanValue(value: unknown): value is ProPlan {
  return value === "tutor" || value === "student";
}

/** Accepts "pro", "PRO" etc. and treats everything else as free. */
export function isProValue(value: unknown): boolean {
  return typeof value === "string" && value.toLowerCase() === PLAN_PRO;
}
