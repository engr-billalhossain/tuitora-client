import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { isProPlanValue, PRO_PURPOSE } from "@/lib/plans";
import { fulfillProPayment } from "@/lib/payments";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Stripe webhook: the authoritative source for granting PRO and recording a
 * payment. The RAW request body is used for signature verification — parsing
 * JSON first would break the HMAC and let forged events through.
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

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const metadata = intent.metadata ?? {};
      if (metadata.purpose === PRO_PURPOSE && intent.status === "succeeded") {
        await fulfillProPayment({
          userId: metadata.userId ?? "",
          plan: metadata.plan,
          transactionId: intent.id,
          stripeSessionId: "",
          amount: intent.amount,
          currency: intent.currency,
        });
      }
    }

    if (event.type === "checkout.session.completed") {
      const checkoutSession = event.data
        .object as Stripe.CheckoutSessionCompletedEvent["data"]["object"];
      const metadata = checkoutSession.metadata ?? {};
      if (
        checkoutSession.mode === "payment" &&
        checkoutSession.payment_status === "paid" &&
        metadata.purpose === PRO_PURPOSE &&
        isProPlanValue(metadata.plan)
      ) {
        // Use the PaymentIntent id as the transaction id so the
        // payment_intent.succeeded event upserts the SAME payment row.
        let transactionId =
          typeof checkoutSession.payment_intent === "string"
            ? checkoutSession.payment_intent
            : checkoutSession.payment_intent?.id;
        if (!transactionId) {
          const refreshed = await stripe.checkout.sessions.retrieve(checkoutSession.id);
          transactionId =
            typeof refreshed.payment_intent === "string"
              ? refreshed.payment_intent
              : refreshed.payment_intent?.id ?? checkoutSession.id;
        }

        await fulfillProPayment({
          userId: metadata.userId ?? checkoutSession.client_reference_id ?? "",
          plan: metadata.plan,
          transactionId,
          stripeSessionId: checkoutSession.id,
          amount: checkoutSession.amount_total ?? 0,
          currency: checkoutSession.currency ?? "",
        });
      }
    }
  } catch (error) {
    // Returning 500 makes Stripe retry. The payment upsert is idempotent.
    console.error("Failed to fulfill Stripe event:", error);
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
