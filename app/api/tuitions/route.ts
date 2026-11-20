import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { normalizeSlots } from "@/lib/slots";
import { getTuitionCollection, serializeTuition } from "@/lib/tuitionDb";

export const dynamic = "force-dynamic";

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** GET /api/tuitions?status=approved | ?status=pending | ?scope=mine */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const requestedStatus = searchParams.get("status");

    const filter: Record<string, unknown> = {};

    if (scope === "mine") {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const email = (user.email || "").toLowerCase();
      const name = user.name || "";
      const conditions: Record<string, unknown>[] = [{ tutorId: user.id }];
      if (email) conditions.push({ tutorEmail: email });
      if (name) {
        // Legacy posts saved before tutor identity was tracked.
        conditions.push({ tutorName: name, tutorId: { $exists: false } });
      }
      filter.$or = conditions;
    } else {
      // Public access is restricted to approved posts. Any other status is
      // privileged data and only admins may request it.
      if (!requestedStatus || requestedStatus === "approved") {
        filter.status = "approved";
      } else if (requestedStatus === "all") {
        const user = await getSessionUser();
        if (!user || (user as { role?: string }).role !== "admin") {
          return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }
      } else {
        const user = await getSessionUser();
        if (!user || (user as { role?: string }).role !== "admin") {
          return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }
        filter.status = requestedStatus;
      }
    }

    const collection = await getTuitionCollection();
    const docs = await collection.find(filter).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ tuitions: docs.map(serializeTuition) });
  } catch (error) {
    console.error("Failed to list tuitions:", error);
    return NextResponse.json({ error: "Failed to list tuitions" }, { status: 500 });
  }
}

/** POST /api/tuitions — creates a pending tuition for the signed-in tutor. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const required = [
      "title",
      "subject",
      "classLevel",
      "mode",
      "fee",
      "days",
      "description",
    ] as const;

    for (const key of required) {
      if (!String(body[key] ?? "").trim()) {
        return NextResponse.json(
          { error: `Missing required field: ${key}` },
          { status: 400 }
        );
      }
    }

    const doc = {
      title: String(body.title).trim(),
      subject: String(body.subject).trim(),
      classLevel: String(body.classLevel).trim(),
      mode: String(body.mode).trim(),
      fee: String(body.fee).trim(),
      days: String(body.days).trim(),
      bannerName: String(body.bannerName ?? "").trim(),
      description: String(body.description).trim(),
      slots: normalizeSlots(body.slots),
      status: "pending",
      tutorId: user.id,
      tutorEmail: (user.email || "").toLowerCase(),
      tutorName: user.name || "Tutor",
      tutorImage: user.image || "",
      createdAt: new Date().toISOString(),
    };

    const collection = await getTuitionCollection();
    const result = await collection.insertOne(doc);

    return NextResponse.json(
      { tuition: serializeTuition({ _id: result.insertedId, ...doc }) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create tuition:", error);
    return NextResponse.json({ error: "Failed to create tuition" }, { status: 500 });
  }
}
