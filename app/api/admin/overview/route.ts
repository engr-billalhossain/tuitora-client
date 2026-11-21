import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { listPayments } from "@/lib/payments";
import { normalizeStatus, serializeTuition } from "@/lib/tuitionDb";

export const dynamic = "force-dynamic";

type LooseDoc = Record<string, unknown> & { _id?: unknown };

function asString(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function timeAgo(value: unknown): string {
  if (!value) return "—";
  const time = new Date(asString(value)).getTime();
  if (Number.isNaN(time)) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const db = await getDb();

    const [userDocs, tuitionDocs, payments] = await Promise.all([
      db.collection("user").find({}).toArray(),
      db.collection("courses").find({}).sort({ createdAt: -1 }).toArray(),
      listPayments(),
    ]);

    // Amounts are stored in cents, exactly as Stripe reported them.
    const totalRevenue = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const users = userDocs as LooseDoc[];
    const tuitions = tuitionDocs as LooseDoc[];

    const roleCount = (role: string) =>
      users.filter((user) => asString(user.role).toLowerCase() === role).length;

    const students = roleCount("student");
    const tutors = roleCount("tutor") + roleCount("teacher");
    const admins = roleCount("admin");
    const totalUsers = users.length;

    const statusCount = (status: "pending" | "approved" | "declined") =>
      tuitions.filter((item) => normalizeStatus(item.status) === status).length;

    const pending = statusCount("pending");
    const approved = statusCount("approved");
    const declined = statusCount("declined");
    const totalTuitions = tuitions.length;

    const roleDistribution = [
      { label: "Students", count: students, dot: "bg-[#B6F70B]" },
      { label: "Tutors", count: tutors, dot: "bg-[#7DB52E]" },
      { label: "Admins", count: admins, dot: "bg-[#5B686B]" },
    ].map((item) => ({
      ...item,
      percent:
        totalUsers === 0 ? "0%" : `${((item.count / totalUsers) * 100).toFixed(1)}%`,
    }));

    // Pending posts are the admin approval queue.
    const queue = tuitions
      .filter((item) => normalizeStatus(item.status) === "pending")
      .map(serializeTuition);

    const recentTuitions = tuitions.slice(0, 5).map(serializeTuition);

    const recentUsers = [...users]
      .sort((a, b) => asString(b.createdAt).localeCompare(asString(a.createdAt)))
      .slice(0, 5)
      .map((user) => ({
        id: asString(user._id),
        name: asString(user.name) || "New user",
        email: asString(user.email),
        role: asString(user.role) || "student",
        createdAt: user.createdAt ? asString(user.createdAt) : undefined,
      }));

    // Activity feed derived entirely from real records.
    const activities = [
      ...recentTuitions.map((item) => ({
        id: `tuition-${item.id}`,
        kind: "tuition",
        title:
          item.status === "approved"
            ? "Tuition approved"
            : item.status === "declined"
              ? "Tuition declined"
              : "New tuition submitted",
        detail: `${item.title} by ${item.tutorName || "a tutor"}.`,
        time: timeAgo(item.reviewedAt || item.createdAt),
        sortKey: item.reviewedAt || item.createdAt || "",
      })),
      ...recentUsers.map((item) => ({
        id: `user-${item.id}`,
        kind: "user",
        title: "New user registered",
        detail: `${item.name} joined as ${item.role}.`,
        time: timeAgo(item.createdAt),
        sortKey: item.createdAt || "",
      })),
    ]
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        title: item.title,
        detail: item.detail,
        time: item.time,
      }));

    return NextResponse.json({
      stats: {
        totalUsers,
        students,
        tutors,
        admins,
        totalTuitions,
        pending,
        approved,
        declined,
        totalRevenue,
      },
      queue,
      recentTuitions,
      recentUsers,
      roleDistribution,
      activities,
    });
  } catch (error) {
    console.error("Failed to load admin overview:", error);
    return NextResponse.json(
      { error: "Failed to load admin overview" },
      { status: 500 }
    );
  }
}
