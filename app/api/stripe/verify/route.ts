import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isProPlanValue, PRO_PLANS, PRO_PURPOSE } from "@/lib/plans";
import { activatePro } from "@/lib/pro";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Fallback confirmation used by the success page (e.g. local dev where Stripe
 * cannot reach a localhost webhook). It asks Stripe directly and grants PRO
 * only if the PaymentIntent is ours, succeeded, belongs to the signed-in user
 * and carries the exact server-side price. The client's word is never trusted.
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const paymentIntentId = String(body.paymentIntentId ?? "").trim();
    if (!/^pi_[A-Za-z0-9_]+$/.test(paymentIntentId)) {
      return NextResponse.json({ error: "Invalid payment intent" }, { status: 400 });
    }

    let intent;
    try {
      intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch {
      return NextResponse.json({ error: "Payment intent not found" }, { status: 404 });
    }

    const metadata = intent.metadata ?? {};
    const plan = metadata.plan;

    if (
      metadata.purpose !== PRO_PURPOSE ||
      metadata.userId !== user.id ||
      !isProPlanValue(plan) ||
      intent.status !== "succeeded" ||
      intent.amount !== PRO_PLANS[plan].amount ||
      intent.currency !== PRO_PLANS[plan].currency
    ) {
      return NextResponse.json(
        { error: "This payment cannot be used to upgrade this account" },
        { status: 403 }
      );
    }

    await activatePro({
      userId: user.id,
      plan,
      paymentIntentId: intent.id,
    });

    return NextResponse.json({ pro: true, plan });
  } catch (error) {
    console.error("Failed to verify payment:", error);
    return NextResponse.json({ error: "Could not verify payment" }, { status: 500 });
  }
}
