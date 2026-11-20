import "server-only";

import type { ProPlan } from "@/lib/plans";
import { getDb, idFilter } from "@/lib/mongodb";

/**
 * Server-only access to the PRO flags stored on the better-auth `user` doc.
 * The client can never write these fields:
 *   - better-auth `additionalFields` are declared with `input: false`
 *   - only this module (called from verified webhook / verified payment check)
 *     performs the write.
 */

type UserDoc = Record<string, unknown> & { _id?: unknown };

export async function getStoredUser(userId: string): Promise<UserDoc | null> {
  const db = await getDb();
  return (await db.collection("user").findOne(idFilter(userId))) as UserDoc | null;
}

export async function isUserPro(userId: string): Promise<boolean> {
  const doc = await getStoredUser(userId);
  const plan = typeof doc?.plan === "string" ? doc.plan.toLowerCase() : "";
  return plan === "pro";
}

export async function linkStripeCustomer(
  userId: string,
  customerId: string
): Promise<void> {
  const db = await getDb();
  await db
    .collection("user")
    .updateOne(idFilter(userId), { $set: { stripeCustomerId: customerId } });
}

/**
 * Idempotent activation. The `$exists: false` guard makes sure a replayed or
 * delayed webhook cannot overwrite a newer activation, and a duplicate event
 * is a harmless no-op.
 */
export async function activatePro(args: {
  userId: string;
  plan: ProPlan;
  paymentIntentId: string;
}): Promise<void> {
  const db = await getDb();
  await db.collection("user").updateOne(
    { ...idFilter(args.userId), plan: { $ne: "pro" } },
    {
      $set: {
        plan: "pro",
        proPlan: args.plan,
        proActivatedAt: new Date().toISOString(),
        stripePaymentIntentId: args.paymentIntentId,
      },
    }
  );
}
