import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createSessionToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

/**
 * Issues a short-lived JWT for the current BetterAuth session.
 * The client calls this right after sign-in and caches the token in memory.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { token, expiresAt } = createSessionToken({
      id: session.user.id,
      role: (session.user as { role?: string | null }).role,
      email: session.user.email,
    });
    return NextResponse.json({ token, expiresAt });
  } catch (error) {
    console.error("Failed to issue session token:", error);
    return NextResponse.json({ error: "Could not issue token" }, { status: 500 });
  }
}
