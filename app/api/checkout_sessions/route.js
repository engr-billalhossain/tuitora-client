import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * Legacy entry point kept for compatibility. Checkout is now handled by the
 * embedded Stripe Payment Element on /checkout.
 */
export async function POST(request) {
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  let plan = "student";
  try {
    const body = await request.clone().json().catch(() => ({}));
    if (body?.plan === "tutor" || body?.plan === "student") plan = body.plan;
  } catch {
    // default plan is fine
  }

  return NextResponse.redirect(
    new URL(`/checkout?plan=${plan}`, origin),
    303
  );
}
