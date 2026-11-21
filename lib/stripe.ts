import "server-only";

import Stripe from "stripe";

let cached: Stripe | undefined;

function getStripe(): Stripe {
  if (cached) return cached;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set in the environment");
  }

  cached = new Stripe(secretKey);
  return cached;
}

/**
 * Lazily initialised Stripe client.
 *
 * The key is read on first use (request time), not at module evaluation. This
 * keeps `next build` from crashing while collecting API route data, when
 * environment variables are not guaranteed to be present.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    const value = (client as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
