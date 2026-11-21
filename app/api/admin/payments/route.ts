import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listPayments } from "@/lib/payments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/payments — administered-only transaction ledger. */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const payments = await listPayments();
    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Failed to load payments:", error);
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 });
  }
}
