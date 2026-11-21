import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { idFilter } from "@/lib/mongodb";
import { normalizeSlots } from "@/lib/slots";
import { getTuitionCollection, serializeTuition } from "@/lib/tuitionDb";
import { safeImageUrl } from "@/lib/utils";
import { cleanText, normalizeMode } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/tuitions/mine/:id — a tutor edits their OWN tuition.
 *
 * Security: ownership is enforced with an server-derived filter (id + email +
 * legacy name), and the approval status is never part of the editable set.
 * Only an admin can approve or reject a post.
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = String((user as { role?: string }).role ?? "").toLowerCase();
    if (role !== "tutor" && role !== "teacher") {
      return NextResponse.json({ error: "Tutor access required" }, { status: 403 });
    }

    const email = (user.email || "").toLowerCase();
    const name = user.name || "";
    const ownership: Record<string, unknown>[] = [{ tutorId: user.id }];
    if (email) ownership.push({ tutorEmail: email });
    if (name) ownership.push({ tutorName: name, tutorId: { $exists: false } });

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    const textFields = [
      "title",
      "subject",
      "classLevel",
      "description",
      "bannerName",
      "location",
    ] as const;
    for (const key of textFields) {
      if (typeof body[key] === "string") {
        update[key] = cleanText(body[key], key === "description" ? 2000 : 120);
      }
    }
    if (typeof body.fee === "string") {
      const fee = cleanText(body.fee, 20);
      update.fee = fee;
      update.monthlyFee = fee;
      update.feeValue = Number.parseFloat(fee.replace(/[^0-9.]/g, "")) || 0;
    }
    if (typeof body.days === "string") {
      const days = cleanText(body.days, 40);
      update.days = days;
      update.daysPerWeek = days;
      update.daysValue = Number.parseInt(days, 10) || 0;
    }
    if (typeof body.mode === "string") update.mode = normalizeMode(body.mode);
    if (typeof body.bannerUrl === "string") {
      update.bannerUrl = safeImageUrl(body.bannerUrl);
      update.bannerImage = update.bannerUrl;
    }
    if (body.slots !== undefined) update.slots = normalizeSlots(body.slots);
    if (typeof body.isActive === "boolean") update.isActive = body.isActive;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }
    update.updatedAt = new Date().toISOString();

    const collection = await getTuitionCollection();
    const updated = await collection.findOneAndUpdate(
      { $and: [idFilter(id), { $or: ownership }] },
      { $set: update },
      { returnDocument: "after" }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Tuition not found or you are not its owner" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tuition: serializeTuition(updated) });
  } catch (error) {
    console.error("Failed to update own tuition:", error);
    return NextResponse.json({ error: "Failed to update tuition" }, { status: 500 });
  }
}
