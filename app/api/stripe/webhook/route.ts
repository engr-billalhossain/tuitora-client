import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { isProPlanValue, PRO_PURPOSE } from "@/lib/plans";
import { activatePro } from "@/lib/pro";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Stripe webhook: the authoritative source for granting PRO.
 * The RAW request body is used for signature verification — parsing JSON
 * first would break the HMAC and let forged events through.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook is not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Invalid Stripe webhook signature:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = paymentIntent.metadata ?? {};

    // Only intents created by this app can activate PRO.
    if (
      metadata.purpose === PRO_PURPOSE &&
      typeof metadata.userId === "string" &&
      metadata.userId &&
      isProPlanValue(metadata.plan)
    ) {
      await activatePro({
        userId: metadata.userId,
        plan: metadata.plan,
        paymentIntentId: paymentIntent.id,
      });
    }
  }

  return NextResponse.json({ received: true });
}
