"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  GraduationCap,
  MapPin,
  Plus,
  RefreshCw,
  XCircle,
  Video,
} from "lucide-react"

import { toast } from "sonner"

import { bannerBackgroundStyle, cn } from "@/lib/utils"
import {
  getBookings,
  getMyTuitions,
  updateMyTuition,
  type Booking,
  type Tuition,
} from "@/lib/actions/postTuitions"
import { getSlot, normalizeSlots } from "@/lib/slots"

function formatDate(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = (status || "pending").toLowerCase()
  const approved = normalized === "approved" || normalized === "published"
  const declined = normalized === "declined" || normalized === "rejected"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
        approved
          ? "border-[#B6F70B]/30 bg-[#B6F70B]/10 text-[#B6F70B]"
          : declined
            ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
            : "border-amber-400/30 bg-amber-400/10 text-amber-300"
      )}
    >
      {approved ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : declined ? (
        <XCircle className="h-3 w-3" />
      ) : (
        <Clock3 className="h-3 w-3" />
      )}
      {approved ? "Approved" : declined ? "Declined" : "Pending review"}
    </span>
  )
}

function TuitionCard({
  tuition,
  bookings,
  onToggleActive,
}: {
  tuition: Tuition
  bookings: Booking[]
  onToggleActive?: (next: boolean) => void
}) {
  const isOnline = tuition.mode.toLowerCase() === "online"
  const bookedIds = new Set(
    bookings
      .filter((booking) => booking.tuitionId === tuition.id)
      .map((booking) => booking.slotId)
  )
  const offeredSlots = normalizeSlots(tuition.slots)

  return (
    <article
      style={bannerBackgroundStyle(tuition.bannerUrl)}
      className="rounded-2xl border border-white/[0.07] bg-[#0D1417] p-5 shadow-[0_8px_40px_rgba(0,0,0,0.2)] transition-colors hover:border-[#B6F70B]/25"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold text-white">{tuition.title}</h2>
          <p className="mt-1 text-[11px] text-gray-500">
            Posted {formatDate(tuition.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-bold",
              tuition.isActive
                ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
                : "border-white/10 bg-white/5 text-gray-400"
            )}
          >
            {tuition.isActive ? "Active" : "Paused"}
          </span>
          <StatusBadge status={tuition.status} />
        </div>
      </div>

      {tuition.status === "declined" && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-[11px] leading-relaxed text-rose-300">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          This tuition was declined by the admin and is not visible to students.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-lg border border-white/10 bg-[#141C21] px-2.5 py-1 text-[11px] font-semibold text-gray-300">
          {tuition.subject}
        </span>
        <span className="rounded-lg border border-white/10 bg-[#141C21] px-2.5 py-1 text-[11px] font-semibold text-gray-300">
          {tuition.classLevel}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold",
            isOnline
              ? "border-sky-400/25 bg-sky-400/10 text-sky-300"
              : "border-violet-400/25 bg-violet-400/10 text-violet-300"
          )}
        >
          {isOnline ? (
            <Video className="h-3 w-3" />
          ) : (
            <MapPin className="h-3 w-3" />
          )}
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[10px] font-bold text-gray-500">
          Time slots ({offeredSlots.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {offeredSlots.map((slotId) => {
            const slot = getSlot(slotId)
            const booked = bookedIds.has(slotId)
            return (
              <span
                key={slotId}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold",
                  booked
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : "border-[#B6F70B]/25 bg-[#B6F70B]/5 text-[#B6F70B]"
                )}
              >
                {slot?.label ?? slotId} · {slot?.start}–{slot?.end}
                {booked && " · Booked"}
              </span>
            )
          })}
        </div>
      </div>

      {tuition.description && (
        <p className="mt-4 line-clamp-3 text-[12px] leading-relaxed text-gray-400">
          {tuition.description}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] pt-4 text-[11px] font-semibold text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-[#B6F70B]" />${tuition.fee || "0"} / month
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-[#B6F70B]" />
          {tuition.days || "—"} per week
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-[#B6F70B]" />
          {tuition.bannerName || "No banner"}
        </span>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onToggleActive?.(!tuition.isActive)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-gray-300 transition-colors hover:border-[#B6F70B]/40 hover:text-white"
        >
          {tuition.isActive ? "Pause (hide from students)" : "Activate"}
        </button>
      </div>
    </article>
  )
}

export default function MyTuitionsPage() {
  const [tuitions, setTuitions] = React.useState<Tuition[]>([])
  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)

  const handleRefresh = () => {
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }

  async function handleToggleActive(tuition: Tuition, next: boolean) {
    try {
      await updateMyTuition(tuition.id, { isActive: next })
      setTuitions((current) =>
        current.map((item) =>
          item.id === tuition.id ? { ...item, isActive: next } : item
        )
      )
      toast.success(next ? "Tuition is now live" : "Tuition paused and hidden from students")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update tuition")
    }
  }

  React.useEffect(() => {
    let active = true

    Promise.all([getMyTuitions(), getBookings()])
      .then(([items, allBookings]) => {
        if (!active) return
        setTuitions(items)
        setBookings(allBookings)
        setError(false)
      })
      .catch((loadError) => {
        if (!active) return
        console.error("Failed to load your tuitions:", loadError)
        setError(true)
        toast.error(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your tuitions."
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [refreshKey])

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-[#080D0F] text-white sm:-mx-6 sm:-mt-6">
      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6">
        {/* HEADER */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#B6F70B]/50 bg-[#B6F70B]/5">
              <GraduationCap className="h-5 w-5 text-[#B6F70B]" strokeWidth={2} />
            </span>
            <div>
              <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-white">
                My Tuitions
              </h1>
              <p className="mt-1.5 text-[11px] text-gray-500">
                All the tuitions you have posted, with their review status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#141C21] text-gray-300 transition-colors hover:border-[#B6F70B]/40 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
            <Link
              href="/dashboard/teacher/post-tuition"
              className="flex h-9 items-center gap-2 rounded-lg bg-[#B6F70B] px-4 text-[11px] font-extrabold text-[#0B1100] transition-colors hover:bg-[#C9FF42]"
            >
              <Plus className="h-4 w-4" />
              Post Tuition
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-[11px] font-semibold text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Could not load your tuitions. Please try refreshing.
          </div>
        )}

        {/* CONTENT */}
        {loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-2xl border border-white/[0.06] bg-[#0D1417]"
              />
            ))}
          </div>
        ) : tuitions.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0D1417] px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#B6F70B]/20 bg-[#B6F70B]/5">
              <BookOpen className="h-6 w-6 text-[#B6F70B]" />
            </span>
            <h2 className="mt-4 text-[15px] font-extrabold text-white">
              No tuitions yet
            </h2>
            <p className="mt-1.5 max-w-sm text-[12px] text-gray-500">
              Post your first tuition and it will appear here while it waits for
              admin approval.
            </p>
            <Link
              href="/dashboard/teacher/post-tuition"
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-[#B6F70B] px-4 text-[11px] font-extrabold text-[#0B1100] transition-colors hover:bg-[#C9FF42]"
            >
              Post your first tuition <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-6 text-[11px] font-semibold text-gray-500">
              {tuitions.length} tuition{tuitions.length === 1 ? "" : "s"} found
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {tuitions.map((tuition) => (
                <TuitionCard
                  key={tuition.id}
                  tuition={tuition}
                  bookings={bookings}
                  onToggleActive={(next) => handleToggleActive(tuition, next)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
