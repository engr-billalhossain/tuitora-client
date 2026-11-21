import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getDb, idFilter } from "@/lib/mongodb";
import { safeImageUrl } from "@/lib/utils";
import { cleanPhone, cleanText } from "@/lib/validation";

export const dynamic = "force-dynamic";

type LooseDoc = Record<string, unknown> & { _id?: unknown };

function serializeProfile(doc: LooseDoc) {
  return {
    id: String(doc._id ?? ""),
    name: String(doc.name ?? ""),
    email: String(doc.email ?? ""),
    image: safeImageUrl(doc.image),
    role: String(doc.role ?? "student"),
    phone: String(doc.phone ?? ""),
    bio: String(doc.bio ?? ""),
    plan: String(doc.plan ?? "free"),
    createdAt: doc.createdAt ? String(doc.createdAt) : undefined,
  };
}

async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** GET /api/profile — the signed-in user's own, sanitised profile. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const doc = (await (await getDb())
      .collection("user")
      .findOne(idFilter(user.id))) as LooseDoc | null;
    if (!doc) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({ profile: serializeProfile(doc) });
  } catch (error) {
    console.error("Failed to load profile:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

/**
 * PATCH /api/profile — update ONLY the editable profile fields.
 * Role, email, plan and all Stripe/customer fields are never accepted here,
 * so a user cannot promote themselves or grant themselves PRO.
 */
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    // A field is only written when it is actually present in the request.
    const update: Record<string, unknown> = {};
    if ("name" in body) {
      const name = cleanText(body.name, 80);
      if (name.length < 2) {
        return NextResponse.json(
          { error: "Name must be at least 2 characters" },
          { status: 400 }
        );
      }
      update.name = name;
    }
    if ("phone" in body) update.phone = cleanPhone(body.phone);
    if ("bio" in body) update.bio = cleanText(body.bio, 500);
    if ("image" in body) {
      update.image = safeImageUrl(body.image);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No editable profile fields were provided" },
        { status: 400 }
      );
    }
    update.updatedAt = new Date().toISOString();

    const db = await getDb();
    const result = await db
      .collection("user")
      .findOneAndUpdate(idFilter(user.id), { $set: update }, { returnDocument: "after" });

    return NextResponse.json({ profile: serializeProfile(result as LooseDoc) });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
