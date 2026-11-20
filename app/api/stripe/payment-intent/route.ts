import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getStoredUser, isUserPro, linkStripeCustomer } from "@/lib/pro";
import {
  isProPlanValue,
  PRO_PLANS,
  PRO_PURPOSE,
  type ProPlan,
} from "@/lib/plans";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Creates a PaymentIntent for an authenticated user.
 * The amount is ALWAYS taken from the server-side plan table — never from the
 * request body — so a client cannot pay $1 and unlock PRO.
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
    }

    if (await isUserPro(user.id)) {
      return NextResponse.json({ alreadyPro: true });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const plan: unknown = body.plan;
    if (!isProPlanValue(plan)) {
      return NextResponse.json(
        { error: "Choose a valid plan ('tutor' or 'student')" },
        { status: 400 }
      );
    }

    const price = PRO_PLANS[plan as ProPlan];

    // Reuse a Stripe customer across upgrades for this account.
    const stored = await getStoredUser(user.id);
    let customerId =
      typeof stored?.stripeCustomerId === "string" ? stored.stripeCustomerId : "";

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await linkStripeCustomer(user.id, customerId);
    }

    const intent = await stripe.paymentIntents.create({
      amount: price.amount,
      currency: price.currency,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      description: `${price.label} upgrade`,
      receipt_email: user.email ?? undefined,
      metadata: {
        userId: user.id,
        plan,
        purpose: PRO_PURPOSE,
        priceAmount: String(price.amount),
      },
    });

    if (!intent.client_secret) {
      throw new Error("Stripe did not return a client secret");
    }

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      amount: price.amount,
      currency: price.currency,
      plan,
    });
  } catch (error) {
    console.error("Failed to create payment intent:", error);
    return NextResponse.json(
      { error: "Could not start payment. Please try again." },
      { status: 500 }
    );
  }
}
