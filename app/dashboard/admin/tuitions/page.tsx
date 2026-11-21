"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  GraduationCap,
  Layers3,
  Monitor,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { getSlot, normalizeSlots } from "@/lib/slots"
import { SubjectIconTile } from "@/components/tuitions/SubjectIcon"
import { TutorAvatar } from "@/components/tuitions/TutorAvatar"
import {
  getTuitions,
  updateTuition,
  updateTuitionStatus,
  type Tuition,
} from "@/lib/actions/postTuitions"
import {
  CLASS_LEVEL_OPTIONS,
  SUBJECT_OPTIONS,
  iconForSubject,
  matchesClassLevel,
  matchesSubject,
} from "@/lib/tuitions"

const PAGE_SIZE = 5

type StatusTab = "all" | "pending" | "approved" | "declined"

const TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "All Tuitions" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "declined", label: "Rejected" },
]

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

function formatFee(value: string) {
  const amount = Number.parseFloat(String(value).replace(/[^0-9.]/g, ""))
  return Number.isFinite(amount) ? amount.toLocaleString("en-US") : value || "0"
}

function FilterPill({
  value,
  onChange,
  placeholder,
  options,
  icon: Icon,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: { value: string; label: string }[]
  icon: LucideIcon
}) {
  return (
    <div className="relative min-w-0">
      <Icon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
      <select
        aria-label={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-white/10 bg-[#141B1E] pr-8 pl-8 text-[11px] font-semibold outline-none transition-colors focus:border-[#B6F70B]/50 sm:w-[150px]",
          value ? "text-gray-200" : "text-gray-400"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#141B1E]">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const value = (status || "pending").toLowerCase()
  if (value === "approved" || value === "published") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#B6F70B]/25 bg-[#B6F70B]/10 px-2 py-0.5 text-[10px] font-bold text-[#B6F70B]">
        <CheckCircle2 className="h-3 w-3" />
        Approved
      </span>
    )
  }
  if (value === "declined" || value === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">
        <XCircle className="h-3 w-3" />
        Rejected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Pending
    </span>
  )
}

function ActionButton({
  icon: Icon,
  label,
  tone,
  onClick,
  disabled,
}: {
  icon: LucideIcon
  label: string
  tone: "approve" | "decline" | "neutral"
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        tone === "approve" &&
          "border-[#B6F70B]/30 bg-[#B6F70B]/15 text-[#B6F70B] hover:bg-[#B6F70B]/25",
        tone === "decline" &&
          "border-rose-500/25 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20",
        tone === "neutral" &&
          "border-white/10 bg-white/[0.03] text-gray-400 hover:border-[#B6F70B]/40 hover:text-[#B6F70B]"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

const INPUT_CLASS =
  "h-9 w-full rounded-lg border border-white/10 bg-[#141C21] px-3 text-[12px] text-gray-200 outline-none transition-colors placeholder:text-gray-600 focus:border-[#B6F70B]/50 focus:ring-2 focus:ring-[#B6F70B]/10"

function DetailModal({
  tuition,
  editing,
  busy,
  onClose,
  onEditToggle,
  onSave,
  onStatus,
}: {
  tuition: Tuition
  editing: boolean
  busy: boolean
  onClose: () => void
  onEditToggle: () => void
  onSave: (patch: Partial<Tuition>) => void
  onStatus: (status: "approved" | "declined" | "pending") => void
}) {
  const [form, setForm] = React.useState({
    title: tuition.title,
    subject: tuition.subject,
    classLevel: tuition.classLevel,
    mode: tuition.mode,
    fee: tuition.fee,
    days: tuition.days,
    description: tuition.description,
  })

  const field = (key: keyof typeof form, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Tutor", value: tuition.tutorName || "—" },
    { label: "Email", value: tuition.tutorEmail || "—" },
    { label: "Subject", value: tuition.subject || "—" },
    { label: "Class level", value: tuition.classLevel || "—" },
    {
      label: "Mode",
      value: tuition.mode === "online" ? "Online (Zoom / Meet)" : "Offline (In-person)",
    },
    { label: "Monthly fee", value: `৳ ${formatFee(tuition.fee)}` },
    { label: "Days / week", value: tuition.days || "—" },
    {
      label: "Time slots",
      value: normalizeSlots(tuition.slots)
        .map((id) => {
          const slot = getSlot(id)
          return slot ? `${slot.start}–${slot.end}` : id
        })
        .join(", "),
    },
    { label: "Submitted", value: formatDate(tuition.createdAt) },
    { label: "Reviewed", value: formatDate(tuition.reviewedAt) },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="max-h-[90vh] w-full max-w-[620px] overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1417] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <SubjectIconTile
              icon={iconForSubject(tuition.subject)}
              className="h-10 w-10 shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-[15px] leading-snug font-extrabold text-white">
                {tuition.title}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={tuition.status} />
                <span className="text-[10px] text-gray-500">
                  ID: {tuition.id}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:border-white/25 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          {editing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-[11px] font-bold text-gray-400">Title</span>
                <input
                  className={INPUT_CLASS}
                  value={form.title}
                  onChange={(event) => field("title", event.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] font-bold text-gray-400">Subject</span>
                <input
                  className={INPUT_CLASS}
                  value={form.subject}
                  onChange={(event) => field("subject", event.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] font-bold text-gray-400">Class level</span>
                <input
                  className={INPUT_CLASS}
                  value={form.classLevel}
                  onChange={(event) => field("classLevel", event.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] font-bold text-gray-400">Mode</span>
                <select
                  className={INPUT_CLASS}
                  value={form.mode}
                  onChange={(event) => field("mode", event.target.value)}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] font-bold text-gray-400">Fee (৳)</span>
                <input
                  className={INPUT_CLASS}
                  value={form.fee}
                  onChange={(event) => field("fee", event.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] font-bold text-gray-400">Days / week</span>
                <input
                  className={INPUT_CLASS}
                  value={form.days}
                  onChange={(event) => field("days", event.target.value)}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-[11px] font-bold text-gray-400">Description</span>
                <textarea
                  rows={4}
                  className={cn(INPUT_CLASS, "h-auto resize-y py-2")}
                  value={form.description}
                  onChange={(event) => field("description", event.target.value)}
                />
              </label>
            </div>
          ) : (
            <>
              <p className="text-[12px] leading-[1.8] text-gray-400">
                {tuition.description || "No description was provided for this tuition."}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                {rows.map((row) => (
                  <div key={row.label} className="min-w-0">
                    <dt className="text-[10px] font-semibold text-gray-500">{row.label}</dt>
                    <dd className="mt-0.5 truncate text-[11px] font-bold text-gray-200">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {tuition.status === "pending" && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onStatus("approved")}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#B6F70B] px-3 text-[11px] font-extrabold text-[#0B1100] hover:bg-[#C9FF42] disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onStatus("declined")}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" /> Decline
                </button>
              </>
            )}
            {tuition.status === "declined" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onStatus("pending")}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[11px] font-bold text-gray-300 hover:border-[#B6F70B]/40 hover:text-[#B6F70B] disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Send back to review
              </button>
            )}
            {tuition.status === "approved" && (
              <button
                type="button"
                onClick={onEditToggle}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[11px] font-bold text-gray-300 hover:border-[#B6F70B]/40 hover:text-[#B6F70B]"
              >
                <Pencil className="h-3.5 w-3.5" />
                {editing ? "Cancel edit" : "Edit details"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-lg border border-white/10 px-3 text-[11px] font-semibold text-gray-400 hover:text-white"
            >
              Close
            </button>
            {editing && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onSave(form)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#B6F70B] px-3 text-[11px] font-extrabold text-[#0B1100] hover:bg-[#C9FF42] disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Save changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminTuitionsPage() {
  const [tuitions, setTuitions] = React.useState<Tuition[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  const [tab, setTab] = React.useState<StatusTab>("all")
  const [query, setQuery] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [classLevel, setClassLevel] = React.useState("")
  const [mode, setMode] = React.useState("")
  const [selected, setSelected] = React.useState<string[]>([])
  const [page, setPage] = React.useState(1)
  const [detail, setDetail] = React.useState<Tuition | null>(null)
  const [editing, setEditing] = React.useState(false)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)

  const reload = () => {
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }

  React.useEffect(() => {
    let active = true
    getTuitions("all")
      .then((items) => {
        if (!active) return
        setTuitions(items)
        setError(false)
      })
      .catch((loadError) => {
        console.error("Failed to load tuitions:", loadError)
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [refreshKey])

  const counts = React.useMemo(
    () => ({
      all: tuitions.length,
      pending: tuitions.filter((item) => item.status === "pending").length,
      approved: tuitions.filter((item) => item.status === "approved").length,
      declined: tuitions.filter((item) => item.status === "declined").length,
    }),
    [tuitions]
  )

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    return tuitions.filter((item) => {
      if (tab !== "all" && item.status !== tab) return false
      if (mode && item.mode.toLowerCase() !== mode) return false
      if (subject && !matchesSubject(item.subject, subject)) return false
      if (classLevel && !matchesClassLevel(item.classLevel, classLevel)) return false
      if (needle) {
        const haystack = [
          item.title,
          item.subject,
          item.classLevel,
          item.tutorName,
          item.tutorEmail,
          item.description,
        ]
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })
  }, [tuitions, tab, query, subject, classLevel, mode])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )
  const firstItem = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const resetFilters = () => {
    setQuery("")
    setSubject("")
    setClassLevel("")
    setMode("")
    setTab("all")
    setPage(1)
  }

  const runStatus = async (id: string, status: "approved" | "declined" | "pending") => {
    setBusyId(id)
    try {
      await updateTuitionStatus(id, status)
      toast.success(
        status === "approved"
          ? "Tuition approved"
          : status === "declined"
            ? "Tuition declined"
            : "Tuition returned to review"
      )
      setDetail(null)
      reload()
    } catch (actionError) {
      console.error(actionError)
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "Could not update this tuition."
      )
    } finally {
      setBusyId(null)
    }
  }

  const saveEdit = async (id: string, patch: Partial<Tuition>) => {
    setBusyId(id)
    try {
      await updateTuition(id, patch)
      toast.success("Tuition changes saved")
      setEditing(false)
      setDetail(null)
      reload()
    } catch (saveError) {
      console.error(saveError)
      toast.error(
        saveError instanceof Error ? saveError.message : "Could not save changes."
      )
    } finally {
      setBusyId(null)
    }
  }

  const toggleSelect = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )

  const allOnPageSelected =
    pageItems.length > 0 && pageItems.every((item) => selected.includes(item.id))

  const togglePageSelection = () => {
    const ids = pageItems.map((item) => item.id)
    setSelected((current) =>
      allOnPageSelected
        ? current.filter((id) => !ids.includes(id))
        : Array.from(new Set([...current, ...ids]))
    )
  }

  const subjectOptions = SUBJECT_OPTIONS.map((value) => ({ value, label: value }))
  const classOptions = CLASS_LEVEL_OPTIONS.filter((option) => option.value).map(
    (option) => ({ value: option.value, label: option.label })
  )

  const pageNumbers: (number | "…")[] = []
  for (let number = 1; number <= totalPages; number += 1) {
    if (number === 1 || number === totalPages || Math.abs(number - currentPage) <= 1) {
      pageNumbers.push(number)
    } else if (pageNumbers[pageNumbers.length - 1] !== "…") {
      pageNumbers.push("…")
    }
  }

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-[#080D0F] text-white sm:-mx-6 sm:-mt-6">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-stretch gap-3">
            <span className="w-1 shrink-0 rounded-full bg-[#B6F70B]" />
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/admin"
                  className="text-gray-500 transition-colors hover:text-[#B6F70B]"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-white">
                  Tuition Approvals
                </h1>
              </div>
              <p className="mt-1 text-[12px] text-gray-500">
                Review, approve and manage every tuition submitted by tutors.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-[#141B1E] px-3 text-[11px] font-semibold text-gray-300 transition-colors hover:border-[#B6F70B]/40 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Status tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          {TABS.map((item) => {
            const active = tab === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setTab(item.key)
                  setPage(1)
                }}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-[11px] font-bold transition-colors",
                  active
                    ? "border-[#B6F70B] bg-[#B6F70B] text-[#0B1100] shadow-[0_4px_16px_rgba(182,247,11,0.15)]"
                    : "border-white/10 bg-[#141B1E] text-gray-400 hover:border-white/20 hover:text-white"
                )}
              >
                {item.key === "pending" && <Clock3 className="h-3.5 w-3.5" />}
                {item.key === "approved" && <CheckCircle2 className="h-3.5 w-3.5" />}
                {item.key === "declined" && <XCircle className="h-3.5 w-3.5" />}
                {item.key === "all" && <Layers3 className="h-3.5 w-3.5" />}
                {item.label} ({counts[item.key]})
              </button>
            )
          })}
        </div>

        {/* Search + filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Search by title, tutor, or subject..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#141B1E] pr-3 pl-9 text-[11px] text-gray-200 outline-none transition-colors placeholder:text-gray-600 focus:border-[#B6F70B]/50"
            />
          </div>
          <FilterPill
            icon={BookOpen}
            placeholder="All Subjects"
            value={subject}
            onChange={(value) => {
              setSubject(value)
              setPage(1)
            }}
            options={subjectOptions}
          />
          <FilterPill
            icon={GraduationCap}
            placeholder="All Class Levels"
            value={classLevel}
            onChange={(value) => {
              setClassLevel(value)
              setPage(1)
            }}
            options={classOptions}
          />
          <FilterPill
            icon={Monitor}
            placeholder="All Modes"
            value={mode}
            onChange={(value) => {
              setMode(value)
              setPage(1)
            }}
            options={[
              { value: "online", label: "Online" },
              { value: "offline", label: "Offline" },
            ]}
          />
          <FilterPill
            icon={SlidersHorizontal}
            placeholder="All Status"
            value={tab === "all" ? "" : tab}
            onChange={(value) => {
              setTab((value || "all") as StatusTab)
              setPage(1)
            }}
            options={TABS.filter((item) => item.key !== "all").map((item) => ({
              value: item.key,
              label: item.label,
            }))}
          />
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-[#141B1E] px-3 text-[11px] font-semibold text-gray-400 transition-colors hover:border-[#B6F70B]/40 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-[11px] font-semibold text-rose-300">
            <XCircle className="h-4 w-4 shrink-0" />
            Could not load tuitions. Please try refreshing.
          </div>
        )}

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-[#11181B]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.015] text-[10px] font-bold tracking-wide text-gray-500 uppercase">
                  <th className="w-10 py-3 pl-4">
                    <input
                      type="checkbox"
                      aria-label="Select all on this page"
                      checked={allOnPageSelected}
                      onChange={togglePageSelection}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-white/20 accent-[#B6F70B]"
                    />
                  </th>
                  <th className="py-3 pr-4">Tuition Details</th>
                  <th className="py-3 pr-4">Tutor</th>
                  <th className="py-3 pr-4">Mode</th>
                  <th className="py-3 pr-4">Fee (Monthly)</th>
                  <th className="py-3 pr-4">Submitted</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, index) => (
                    <tr key={index} className="border-b border-white/[0.05]">
                      <td colSpan={8} className="h-[74px] px-4">
                        <div className="h-8 animate-pulse rounded-lg bg-white/[0.04]" />
                      </td>
                    </tr>
                  ))
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[#B6F70B]/20 bg-[#B6F70B]/5">
                        <Search className="h-5 w-5 text-[#B6F70B]" />
                      </span>
                      <p className="mt-3 text-[12px] font-bold text-white">No tuitions found</p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        Try a different tab or clear your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item) => {
                    const isPending = item.status === "pending"
                    const isApproved = item.status === "approved"
                    const isOnline = item.mode.toLowerCase() === "online"
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="py-3 pl-4 align-middle">
                          <input
                            type="checkbox"
                            aria-label={`Select ${item.title}`}
                            checked={selected.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            className="h-3.5 w-3.5 cursor-pointer rounded border-white/20 accent-[#B6F70B]"
                          />
                        </td>
                        <td className="py-3 pr-4 align-middle">
                          <div className="flex items-center gap-3">
                            <SubjectIconTile
                              icon={iconForSubject(item.subject)}
                              className="h-10 w-10 rounded-lg"
                              iconClassName="h-5 w-5"
                            />
                            <div className="min-w-0">
                              <p className="max-w-[240px] truncate text-[12px] font-bold text-white">
                                {item.title}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-gray-500">
                                {item.subject || "General"}
                                {item.classLevel ? ` · ${item.classLevel}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 align-middle">
                          <div className="flex items-center gap-2">
                            <TutorAvatar
                              name={item.tutorName || "Tutor"}
                              src={item.tutorImage}
                              className="h-8 w-8 text-[10px]"
                            />
                            <div className="min-w-0">
                              <p className="max-w-[130px] truncate text-[11px] font-bold text-white">
                                {item.tutorName || "Unknown tutor"}
                              </p>
                              <p className="mt-0.5 text-[10px] text-amber-300/80">
                                {typeof item.rating === "number"
                                  ? `★ ${item.rating.toFixed(1)} (${item.reviews ?? 0})`
                                  : "New tutor"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 align-middle">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                              isOnline
                                ? "border-sky-400/40 bg-sky-400/5 text-sky-300"
                                : "border-violet-400/40 bg-violet-400/5 text-violet-300"
                            )}
                          >
                            {isOnline ? (
                              <Monitor className="h-3 w-3" />
                            ) : (
                              <BookOpen className="h-3 w-3" />
                            )}
                            {isOnline ? "Online" : "Offline"}
                          </span>
                        </td>
                        <td className="py-3 pr-4 align-middle font-bold whitespace-nowrap text-white">
                          ৳ {formatFee(item.fee)}
                        </td>
                        <td className="py-3 pr-4 align-middle whitespace-nowrap text-gray-400">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="py-3 pr-4 align-middle">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-3 pr-4 align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <ActionButton
                                  icon={Check}
                                  label="Approve tuition"
                                  tone="approve"
                                  disabled={busyId === item.id}
                                  onClick={() => runStatus(item.id, "approved")}
                                />
                                <ActionButton
                                  icon={X}
                                  label="Decline tuition"
                                  tone="decline"
                                  disabled={busyId === item.id}
                                  onClick={() => runStatus(item.id, "declined")}
                                />
                              </>
                            )}
                            {isApproved && (
                              <ActionButton
                                icon={Pencil}
                                label="Edit tuition details"
                                tone="neutral"
                                onClick={() => {
                                  setDetail(item)
                                  setEditing(true)
                                }}
                              />
                            )}
                            <ActionButton
                              icon={Eye}
                              label="View full details"
                              tone="neutral"
                              onClick={() => {
                                setDetail(item)
                                setEditing(false)
                              }}
                            />
                            {item.status === "declined" && (
                              <ActionButton
                                icon={RotateCcw}
                                label="Send back to review"
                                tone="neutral"
                                disabled={busyId === item.id}
                                onClick={() => runStatus(item.id, "pending")}
                              />
                            )}
                            <button
                              type="button"
                              aria-label="More actions"
                              title="More actions"
                              onClick={() => {
                                setDetail(item)
                                setEditing(false)
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-gray-500 transition-colors hover:text-white"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3">
            <p className="text-[11px] font-semibold text-gray-500">
              Showing <span className="font-bold text-white">{firstItem}</span> –{" "}
              <span className="font-bold text-white">{lastItem}</span> of{" "}
              <span className="font-bold text-white">{filtered.length}</span> tuitions
              {selected.length > 0 && (
                <span className="ml-2 text-[#B6F70B]">
                  · {selected.length} selected
                </span>
              )}
            </p>
            <nav aria-label="Tuition pages" className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#141B1E] text-gray-400 transition-colors hover:border-[#B6F70B]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {pageNumbers.map((number, index) =>
                number === "…" ? (
                  <span key={`gap-${index}`} className="px-1 text-[11px] text-gray-600">
                    …
                  </span>
                ) : (
                  <button
                    key={number}
                    type="button"
                    aria-current={number === currentPage ? "page" : undefined}
                    onClick={() => setPage(number)}
                    className={cn(
                      "h-7 min-w-7 rounded-md border px-1.5 text-[11px] font-bold transition-colors",
                      number === currentPage
                        ? "border-[#B6F70B] bg-[#B6F70B] text-[#0B1100]"
                        : "border-white/10 bg-[#141B1E] text-gray-400 hover:border-[#B6F70B]/40 hover:text-white"
                    )}
                  >
                    {number}
                  </button>
                )
              )}
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#141B1E] text-gray-400 transition-colors hover:border-[#B6F70B]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {detail && (
        <DetailModal
          tuition={detail}
          editing={editing}
          busy={busyId === detail.id}
          onClose={() => {
            setDetail(null)
            setEditing(false)
          }}
          onEditToggle={() => setEditing((value) => !value)}
          onSave={(patch) => saveEdit(detail.id, patch)}
          onStatus={(status) => runStatus(detail.id, status)}
        />
      )}
    </div>
  )
}
