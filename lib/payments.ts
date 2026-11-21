import "server-only";

import type { ProPlan } from "@/lib/plans";
import { PRO_PLANS, isProPlanValue } from "@/lib/plans";
import { getDb, idFilter } from "@/lib/mongodb";
import { activatePro } from "@/lib/pro";

/** Payments are stored separately from the user document so every charge has
 *  its own immutable transaction record. Only verified Stripe events write here. */
export const PAYMENT_COLLECTION = "payments";

type LooseDoc = Record<string, unknown> & { _id?: unknown };

let indexesReady: Promise<void> | null = null;

async function ensureIndexes(): Promise<void> {
  if (!indexesReady) {
    indexesReady = (async () => {
      const collection = (await getDb()).collection(PAYMENT_COLLECTION);
      await Promise.all([
        collection.createIndex({ transactionId: 1 }, { unique: true, name: "uniq_transaction" }),
        collection.createIndex({ stripeSessionId: 1 }, { sparse: true, name: "idx_session" }),
        collection.createIndex({ userEmail: 1 }, { name: "idx_user_email" }),
      ]);
    })().catch((error) => {
      indexesReady = null;
      throw error;
    });
  }
  return indexesReady;
}

export type PaymentView = {
  id: string;
  userEmail: string;
  userName: string;
  userRole: string;
  planName: string;
  amount: number;
  currency: string;
  transactionId: string;
  stripeSessionId: string;
  paymentStatus: "paid";
  paidAt: string;
};

function serializePayment(doc: LooseDoc): PaymentView {
  return {
    id: String(doc._id ?? ""),
    userEmail: String(doc.userEmail ?? ""),
    userName: String(doc.userName ?? ""),
    userRole: String(doc.userRole ?? ""),
    planName: String(doc.planName ?? ""),
    amount: Number(doc.amount ?? 0),
    currency: String(doc.currency ?? ""),
    transactionId: String(doc.transactionId ?? ""),
    stripeSessionId: String(doc.stripeSessionId ?? ""),
    paymentStatus: "paid",
    paidAt: String(doc.paidAt ?? ""),
  };
}

/**
 * Idempotent write. `$setOnInsert` plus a unique index on transactionId means a
 * replayed webhook can never create a second payment row.
 */
export async function recordProPayment(args: {
  userId: string;
  plan: ProPlan;
  transactionId: string;
  stripeSessionId: string;
  amount: number;
  currency: string;
}): Promise<void> {
  if (!args.transactionId.startsWith("pi_") && !args.transactionId.startsWith("cs_")) {
    throw new Error("Invalid transaction id");
  }

  const db = await getDb();
  const user = (await db
    .collection("user")
    .findOne(idFilter(args.userId), {
      projection: { name: 1, email: 1, role: 1 },
    })) as LooseDoc | null;

  const now = new Date().toISOString();
  await ensureIndexes();

  await db.collection(PAYMENT_COLLECTION).updateOne(
    { transactionId: args.transactionId },
    {
      $setOnInsert: {
        userId: args.userId,
        userEmail: String(user?.email ?? "").toLowerCase(),
        userName: String(user?.name ?? ""),
        userRole: String(user?.role ?? "student"),
        planName: PRO_PLANS[args.plan].label,
        proPlan: args.plan,
        amount: args.amount,
        currency: args.currency,
        transactionId: args.transactionId,
        stripeSessionId: args.stripeSessionId,
        paymentIntentId: args.transactionId,
        paymentStatus: "paid",
        paidAt: now,
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { upsert: true }
  );
}

/**
 * The single fulfillment path used by both the webhook and the verification
 * endpoint. It validates the price against the server table, records the
 * transaction, then grants PRO.
 */
export async function fulfillProPayment(args: {
  userId: string;
  plan: unknown;
  transactionId: string;
  stripeSessionId: string;
  amount: unknown;
  currency: unknown;
}): Promise<void> {
  if (!isProPlanValue(args.plan)) throw new Error("Invalid plan in payment metadata");
  if (!args.userId) throw new Error("Missing user in payment metadata");
  if (!args.transactionId) throw new Error("Missing transaction id");

  const price = PRO_PLANS[args.plan];
  if (Number(args.amount) !== price.amount) throw new Error("Payment amount mismatch");
  if (String(args.currency ?? "").toLowerCase() !== price.currency) {
    throw new Error("Payment currency mismatch");
  }

  await recordProPayment({
    userId: args.userId,
    plan: args.plan,
    transactionId: args.transactionId,
    stripeSessionId: args.stripeSessionId,
    amount: price.amount,
    currency: price.currency,
  });

  await activatePro({
    userId: args.userId,
    plan: args.plan,
    paymentIntentId: args.transactionId,
  });
}

/** Admin-only listing. */
export async function listPayments(limit = 200): Promise<PaymentView[]> {
  await ensureIndexes();
  const db = await getDb();
  const docs = await db
    .collection(PAYMENT_COLLECTION)
    .find({})
    .sort({ paidAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 500))
    .toArray();
  return docs.map((doc) => serializePayment(doc as LooseDoc));
}
