import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isProPlanValue, PRO_PLANS, PRO_PURPOSE } from "@/lib/plans";
import { fulfillProPayment } from "@/lib/payments";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Fallback confirmation used by the success page (e.g. local dev where Stripe
 * cannot reach a localhost webhook). It asks Stripe directly and grants PRO
 * only for OUR paid payment intent/session belonging to the signed-in user and
 * carrying the exact server-side price. The client's word is never trusted.
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
    const sessionId = String(body.sessionId ?? "").trim();

    // Checkout Session (hosted Stripe Checkout) flow.
    if (sessionId) {
      if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
        return NextResponse.json({ error: "Invalid checkout session" }, { status: 400 });
      }
      let checkoutSession;
      try {
        checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      } catch {
        return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
      }
      const metadata = checkoutSession.metadata ?? {};
      if (
        checkoutSession.mode !== "payment" ||
        checkoutSession.payment_status !== "paid" ||
        metadata.purpose !== PRO_PURPOSE ||
        checkoutSession.client_reference_id !== user.id ||
        !isProPlanValue(metadata.plan)
      ) {
        return NextResponse.json(
          { error: "This checkout cannot be used to upgrade this account" },
          { status: 403 }
        );
      }
      const plan = metadata.plan;
      if (
        checkoutSession.amount_total !== PRO_PLANS[plan].amount ||
        checkoutSession.currency !== PRO_PLANS[plan].currency
      ) {
        return NextResponse.json({ error: "Payment amount mismatch" }, { status: 403 });
      }
      const intentId =
        typeof checkoutSession.payment_intent === "string"
          ? checkoutSession.payment_intent
          : checkoutSession.payment_intent?.id;
      if (!intentId) {
        return NextResponse.json({ error: "Payment intent not ready" }, { status: 409 });
      }
      await fulfillProPayment({
        userId: user.id,
        plan,
        transactionId: intentId,
        stripeSessionId: checkoutSession.id,
        amount: checkoutSession.amount_total,
        currency: checkoutSession.currency,
      });
      return NextResponse.json({ pro: true, plan });
    }

    // Embedded Payment Element flow.
    if (!/^pi_[A-Za-z0-9_]+$/.test(paymentIntentId)) {
      return NextResponse.json({ error: "Invalid payment reference" }, { status: 400 });
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

    await fulfillProPayment({
      userId: user.id,
      plan,
      transactionId: intent.id,
      stripeSessionId: "",
      amount: intent.amount,
      currency: intent.currency,
    });

    return NextResponse.json({ pro: true, plan });
  } catch (error) {
    console.error("Failed to verify payment:", error);
    return NextResponse.json({ error: "Could not verify payment" }, { status: 500 });
  }
}
