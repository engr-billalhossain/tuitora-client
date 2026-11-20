import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { idFilter } from "@/lib/mongodb";
import { normalizeSlots } from "@/lib/slots";
import { getTuitionCollection, serializeTuition } from "@/lib/tuitionDb";
import { safeImageUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** PATCH /api/tuitions/:id — admin-only approve / decline action. */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/tuitions/[id]">
) {
  try {
    const { id } = await ctx.params;

    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const status = body.status;
    const validStatus = status === "approved" || status === "declined" || status === "pending";
    if (!validStatus) {
      return NextResponse.json(
        { error: "Status must be 'approved', 'declined' or 'pending'" },
        { status: 400 }
      );
    }

    const editable = [
      "title",
      "subject",
      "classLevel",
      "mode",
      "fee",
      "days",
      "bannerName",
      "bannerUrl",
      "description",
    ] as const;
    const update: Record<string, unknown> = {
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: user.id,
    };
    for (const key of editable) {
      if (typeof body[key] === "string") {
        update[key] =
          key === "bannerUrl" ? safeImageUrl(body[key]) : (body[key] as string).trim();
      }
    }
    if (body.slots !== undefined) {
      update.slots = normalizeSlots(body.slots);
    }

    const collection = await getTuitionCollection();
    const updated = await collection.findOneAndUpdate(
      idFilter(id),
      { $set: update },
      { returnDocument: "after" }
    );

    if (!updated) {
      return NextResponse.json({ error: "Tuition not found" }, { status: 404 });
    }

    return NextResponse.json({ tuition: serializeTuition(updated) });
  } catch (error) {
    console.error("Failed to update tuition status:", error);
    return NextResponse.json({ error: "Failed to update tuition" }, { status: 500 });
  }
}
