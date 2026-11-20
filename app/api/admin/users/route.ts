import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getDb, idFilter } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

type LooseDoc = Record<string, unknown> & { _id?: unknown };

const ROLES = ["student", "tutor", "admin"] as const;
type Role = (typeof ROLES)[number];

function asString(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function normalizeRole(value: unknown): Role {
  const role = asString(value).toLowerCase();
  if (role === "teacher") return "tutor";
  if ((ROLES as readonly string[]).includes(role)) return role as Role;
  return "student";
}

function serializeUser(user: LooseDoc) {
  return {
    id: asString(user._id),
    name: asString(user.name) || "New user",
    email: asString(user.email),
    role: normalizeRole(user.role),
    plan: asString(user.plan) || "FREE",
    createdAt: user.createdAt ? asString(user.createdAt) : undefined,
  };
}

async function isAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) return { authorized: false as const, status: 401, error: "Unauthorized" };
  if ((user as { role?: string }).role !== "admin") {
    return { authorized: false as const, status: 403, error: "Admin access required" };
  }
  return { authorized: true as const, userId: user.id };
}

/** GET /api/admin/users — list every registered user (admin only). */
export async function GET() {
  try {
    const guard = await isAdmin();
    if (!guard.authorized) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const db = await getDb();
    const docs = (await db
      .collection("user")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()) as LooseDoc[];

    return NextResponse.json({ users: docs.map(serializeUser) });
  } catch (error) {
    console.error("Failed to load users:", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

/** PATCH /api/admin/users — change a user's role (admin only). */
export async function PATCH(request: Request) {
  try {
    const guard = await isAdmin();
    if (!guard.authorized) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const id = asString(body.id);
    const role = asString(body.role).toLowerCase();

    if (!id) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }
    if (!(ROLES as readonly string[]).includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'student', 'tutor' or 'admin'" },
        { status: 400 }
      );
    }
    if (id === guard.userId) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const updated = (await db.collection("user").findOneAndUpdate(
      idFilter(id),
      { $set: { role } },
      { returnDocument: "after" }
    )) as LooseDoc | null;

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: serializeUser(updated) });
  } catch (error) {
    console.error("Failed to update user role:", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
