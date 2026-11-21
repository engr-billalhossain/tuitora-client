import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  FREE_TUITION_POST_LIMIT,
  PLAN_LIMIT_REACHED,
} from "@/lib/plan-limits";
import { isUserPro } from "@/lib/pro";
import { normalizeSlots } from "@/lib/slots";
import {
  getBrowseFacets,
  getTuitionCollection,
  queryApprovedTuitions,
  serializeTuition,
  type BrowseQuery,
} from "@/lib/tuitionDb";
import { safeImageUrl } from "@/lib/utils";
import { cleanText, isPositiveAmount, normalizeMode } from "@/lib/validation";

export const dynamic = "force-dynamic";

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** Matches every tuition owned by a tutor, including legacy posts. */
function tutorFilter(user: {
  id: string;
  email?: string | null;
  name?: string | null;
}): { $or: Record<string, unknown>[] } {
  const email = (user.email || "").toLowerCase();
  const name = user.name || "";
  const conditions: Record<string, unknown>[] = [{ tutorId: user.id }];
  if (email) conditions.push({ tutorEmail: email });
  if (name) {
    // Legacy posts saved before tutor identity was tracked.
    conditions.push({ tutorName: name, tutorId: { $exists: false } });
  }
  return { $or: conditions };
}

function numberParam(value: string | null): number | undefined {
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * GET /api/tuitions
 * Public browse: ?status=approved&search=&subject=&classLevel=&mode=
 *   &levels=ssc,hsc&modes=online&minFee=&maxFee=&days=&sort=&page=&limit=
 * Privileged: ?status=pending|declined|all  |  ?scope=mine
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const requestedStatus = searchParams.get("status");
    const splitList = (key: string) =>
      (searchParams.get(key) || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

    // Server-side search / filter / pagination for the public browse page.
    // Legacy callers (getTuitions("approved")) still receive the same array.
    if (!scope && (!requestedStatus || requestedStatus === "approved")) {
      const query: BrowseQuery = {
        search: searchParams.get("search") || searchParams.get("q") || "",
        subject: searchParams.get("subject") || "",
        classLevel: searchParams.get("classLevel") || searchParams.get("class") || "",
        location: searchParams.get("location") || "",
        modes: splitList("modes"),
        levels: splitList("levels"),
        minFee: numberParam(searchParams.get("minFee")),
        maxFee: numberParam(searchParams.get("maxFee")),
        days: searchParams.get("days") || "",
        sort: searchParams.get("sort") || "newest",
        page: numberParam(searchParams.get("page")) ?? 1,
        limit: numberParam(searchParams.get("limit")) ?? 12,
      };
      const hasBrowseParams = [
        "search",
        "q",
        "subject",
        "classLevel",
        "class",
        "location",
        "modes",
        "levels",
        "minFee",
        "maxFee",
        "days",
        "page",
        "limit",
      ].some((key) => searchParams.has(key));

      if (hasBrowseParams) {
        const result = await queryApprovedTuitions(query);
        return NextResponse.json({
          ...result,
          facets: await getBrowseFacets(),
        });
      }
    }

    const filter: Record<string, unknown> = {};

    if (scope === "mine") {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      filter.$or = tutorFilter(user).$or;
    } else {
      // Public access is restricted to approved posts. Any other status is
      // privileged data and only admins may request it.
      if (!requestedStatus || requestedStatus === "approved") {
        filter.status = "approved";
        // Inactive posts are kept for the tutor/admin but hidden from students.
        filter.isActive = { $ne: false };
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

    // Free tutors may publish up to two tuitions. PRO accounts are unlimited.
    // The check lives on the server so the limit cannot be skipped from the
    // browser, and the PRO flag is read from the database (never from a client
    // supplied value).
    const collection = await getTuitionCollection();
    if (!(await isUserPro(user.id))) {
      const postCount = await collection.countDocuments(tutorFilter(user));
      if (postCount >= FREE_TUITION_POST_LIMIT) {
        return NextResponse.json(
          {
            error: `Free plan allows up to ${FREE_TUITION_POST_LIMIT} tuition posts. Upgrade to PRO to post unlimited tuitions.`,
            code: PLAN_LIMIT_REACHED,
          },
          { status: 403 }
        );
      }
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

    const title = cleanText(body.title, 100);
    const description = cleanText(body.description, 2000);
    const fee = cleanText(body.fee, 20);
    if (title.length < 3 || description.length < 10 || !isPositiveAmount(fee)) {
      return NextResponse.json(
        { error: "Provide a title, a description and a valid monthly fee" },
        { status: 400 }
      );
    }

    const mode = normalizeMode(body.mode);
    const days = cleanText(body.days, 40);
    const bannerUrl = safeImageUrl(body.bannerUrl);
    const location = cleanText(body.location, 120);

    // Canonical fields are written alongside legacy names so both old and new
    // readers see a consistent document.
    const doc = {
      title,
      subject: cleanText(body.subject, 80),
      classLevel: cleanText(body.classLevel, 80),
      mode,
      fee,
      monthlyFee: fee,
      feeValue: Number.parseFloat(fee.replace(/[^0-9.]/g, "")) || 0,
      days,
      daysPerWeek: days,
      daysValue: Number.parseInt(days, 10) || 0,
      bannerName: cleanText(body.bannerName, 120),
      bannerUrl,
      bannerImage: bannerUrl,
      location,
      description,
      slots: normalizeSlots(body.slots),
      status: "pending",
      approvalStatus: "pending",
      isActive: true,
      tutorId: user.id,
      tutorEmail: (user.email || "").toLowerCase(),
      tutorName: user.name || "Tutor",
      tutorImage: safeImageUrl(user.image),
      createdAt: new Date().toISOString(),
    };

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
