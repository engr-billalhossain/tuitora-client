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
 * Creates a real Stripe Checkout Session (hosted payment page).
 * The price always comes from the server-side plan table; the browser only
 * sends a plan name and can never influence the amount or currency.
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
    if (!isProPlanValue(body.plan)) {
      return NextResponse.json(
        { error: "Choose a valid plan ('tutor' or 'student')" },
        { status: 400 }
      );
    }
    const plan = body.plan as ProPlan;
    const price = PRO_PLANS[plan];

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

    const baseUrl = (process.env.BETTER_AUTH_URL || new URL(request.url).origin).replace(/\/$/, "");
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: price.currency,
            unit_amount: price.amount,
            product_data: { name: price.label },
          },
        },
      ],
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancel`,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan, purpose: PRO_PURPOSE },
      payment_intent_data: {
        metadata: {
          userId: user.id,
          plan,
          purpose: PRO_PURPOSE,
          priceAmount: String(price.amount),
        },
      },
    });

    if (!checkoutSession.url) {
      throw new Error("Stripe did not return a checkout URL");
    }
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
