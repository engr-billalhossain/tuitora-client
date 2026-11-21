"use client";

import * as React from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth-client";
import {
  getTeacherBookings,
  respondToApplication,
  type BookingRecord,
} from "@/lib/reviews";

type Filter = "all" | "pending" | "accepted" | "rejected";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

export default function TeacherApplicantsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;
    getTeacherBookings()
      .then((list) => {
        if (active) setBookings(list);
      })
      .catch((err) => {
        if (active) {
          const message = err instanceof Error ? err.message : "Failed to load applicants";
          setError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  async function respond(bookingId: string, action: "accept" | "reject") {
    setBusyId(bookingId);
    setError("");
    try {
      await respondToApplication(bookingId, action);
      toast.success(
        action === "accept" ? "Application accepted" : "Application rejected"
      );
      setBookings((current) =>
        current.map((item) =>
          item.id === bookingId
            ? { ...item, status: action === "accept" ? "accepted" : "rejected" }
            : item
        )
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not respond to application";
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  const visible = bookings.filter((booking) => {
    if (filter !== "all" && booking.status !== filter) return false;
    if (!query.trim()) return true;
    const haystack = [
      booking.studentName,
      booking.studentEmail,
      booking.tuitionTitle,
      booking.subject,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const pendingCount = bookings.filter((item) => item.status === "pending").length;
  const acceptedCount = bookings.filter((item) => item.status === "accepted").length;
  const rejectedCount = bookings.filter((item) => item.status === "rejected").length;

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-[#080D0F] text-white sm:-mx-6 sm:-mt-6">
      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#B6F70B]/50 bg-[#B6F70B]/5">
            <Users className="h-5 w-5 text-[#B6F70B]" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-white">
              Applicants
            </h1>
            <p className="mt-1.5 text-[11px] text-gray-500">
              Add students to your course. Once added, they can review your teaching.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/5 px-4 py-3 text-[12px] font-semibold text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {(
            [
              { value: "all", label: "All", count: bookings.length },
              { value: "pending", label: "Pending", count: pendingCount },
              { value: "accepted", label: "Added to course", count: acceptedCount },
              { value: "rejected", label: "Rejected", count: rejectedCount },
            ] as const
          ).map((tab) => (
            <Button
              key={tab.value}
              type="button"
              variant={filter === tab.value ? "default" : "outline"}
              onClick={() => setFilter(tab.value)}
              className={`h-9 rounded-lg px-4 text-[11px] font-bold ${
                filter === tab.value
                  ? "bg-[#B6F70B] text-[#0B1100] hover:bg-[#C9FF42]"
                  : "border-white/10 bg-transparent text-gray-300 hover:text-white"
              }`}
            >
              {tab.label} ({tab.count})
            </Button>
          ))}
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search student or tuition..."
            className="h-9 w-full rounded-lg border-white/10 bg-[#141C21] text-[12px] text-white placeholder:text-gray-500 sm:ml-auto sm:w-[260px]"
          />
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-[#10191D]"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0D1417] px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#B6F70B]/20 bg-[#B6F70B]/5">
              <Users className="h-6 w-6 text-[#B6F70B]" />
            </span>
            <h2 className="mt-4 text-[15px] font-extrabold text-white">
              No applicants here
            </h2>
            <p className="mt-1.5 max-w-sm text-[12px] text-gray-500">
              New student applications will show up here as soon as they book a slot.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {visible.map((booking) => (
              <Card
                key={booking.id}
                className="rounded-2xl border-white/[0.07] bg-[#0D1417] py-0 shadow-none"
              >
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <h2 className="text-[14px] font-extrabold text-white">
                      {booking.tuitionTitle || "Tuition"}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] font-semibold text-gray-400">
                      <span className="inline-flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5 text-[#B6F70B]" />
                        {booking.studentName || "Student"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5 text-[#B6F70B]" />
                        {booking.slotLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-[#B6F70B]" />
                        {formatDate(booking.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {booking.status === "accepted" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#B6F70B]/30 bg-[#B6F70B]/10 px-2.5 py-1 text-[10px] font-bold text-[#B6F70B]">
                        <CheckCircle2 className="h-3 w-3" />
                        Added to course
                      </span>
                    ) : booking.status === "rejected" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-300">
                        <XCircle className="h-3 w-3" />
                        Rejected
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          disabled={busyId === booking.id}
                          onClick={() => respond(booking.id, "reject")}
                          className="h-9 rounded-lg border border-rose-500/40 bg-transparent px-3 text-[11px] font-extrabold text-rose-300 hover:bg-rose-500/10 disabled:opacity-60"
                        >
                          Reject
                        </Button>
                        <Button
                          type="button"
                          disabled={busyId === booking.id}
                          onClick={() => respond(booking.id, "accept")}
                          className="h-9 rounded-lg bg-[#B6F70B] px-4 text-[11px] font-extrabold text-[#0B1100] hover:bg-[#C9FF42] disabled:opacity-60"
                        >
                          {busyId === booking.id ? "Adding…" : "Add to course"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
