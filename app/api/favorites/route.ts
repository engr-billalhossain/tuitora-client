import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const COLLECTION = "favorites";

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** GET /api/favorites — ids of the signed-in student's saved tuitions. */
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = await getDb();
    const items = await db
      .collection(COLLECTION)
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({
      tuitionIds: items.map((item) => String(item.tuitionId)),
    });
  } catch (error) {
    console.error("Failed to load favorites:", error);
    return NextResponse.json({ error: "Failed to load saved tuitions" }, { status: 500 });
  }
}

/** POST /api/favorites — bookmark a tuition (students only). */
export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = String((user as { role?: string }).role || "student").toLowerCase();
    if (role !== "student") {
      return NextResponse.json({ error: "Students only" }, { status: 403 });
    }
    const body = (await request.json().catch(() => ({}))) as { tuitionId?: string };
    const tuitionId = String(body.tuitionId || "").trim();
    if (!tuitionId) {
      return NextResponse.json({ error: "tuitionId is required" }, { status: 400 });
    }
    const db = await getDb();
    await db.collection(COLLECTION).updateOne(
      { userId: user.id, tuitionId },
      { $setOnInsert: { createdAt: new Date().toISOString() } },
      { upsert: true }
    );
    return NextResponse.json({ saved: true, tuitionId }, { status: 201 });
  } catch (error) {
    console.error("Failed to save tuition:", error);
    return NextResponse.json({ error: "Failed to save tuition" }, { status: 500 });
  }
}

/** DELETE /api/favorites — remove a bookmark. */
export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as { tuitionId?: string };
    const tuitionId = String(body.tuitionId || "").trim();
    if (!tuitionId) {
      return NextResponse.json({ error: "tuitionId is required" }, { status: 400 });
    }
    const db = await getDb();
    await db.collection(COLLECTION).deleteOne({ userId: user.id, tuitionId });
    return NextResponse.json({ saved: false, tuitionId });
  } catch (error) {
    console.error("Failed to remove saved tuition:", error);
    return NextResponse.json({ error: "Failed to remove saved tuition" }, { status: 500 });
  }
}
