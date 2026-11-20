"use client"

import * as React from "react"
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  Layers3,
  Menu,
  RefreshCw,
  Search,
  UserPlus,
  UsersRound,
  X,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  updateTuitionStatus,
  type Tuition,
} from "@/lib/actions/postTuitions"

/* ============================================================================
   All data below comes from GET /api/admin/overview (MongoDB).
   ========================================================================== */

type AdminStats = {
  totalUsers: number
  students: number
  tutors: number
  admins: number
  totalTuitions: number
  pending: number
  approved: number
  declined: number
}

type ActivityItem = {
  id: string
  kind: "tuition" | "user"
  title: string
  detail: string
  time: string
}

type RoleSlice = { label: string; count: number; percent: string; dot: string }

type AdminOverview = {
  stats: AdminStats
  queue: Tuition[]
  recentTuitions: Tuition[]
  recentUsers: {
    id: string
    name: string
    email: string
    role: string
    createdAt?: string
  }[]
  roleDistribution: RoleSlice[]
  activities: ActivityItem[]
}

const cardClass =
  "gap-0 rounded-xl border border-white/[0.07] bg-[#11181B] p-0 text-white shadow-none ring-0"

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

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

function PanelHeading({
  icon: Icon,
  children,
  href = "#",
  linkLabel = "View All",
}: {
  icon: LucideIcon
  children: React.ReactNode
  href?: string
  linkLabel?: string
}) {
  return (
    <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
      <CardTitle className="flex items-center gap-2 text-[13px] font-bold text-white">
        <Icon className="h-4 w-4 text-[#B6F70B]" />
        {children}
      </CardTitle>
      <a
        href={href}
        className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[#B6F70B] transition-colors hover:text-[#C9FF42]"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </CardHeader>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: LucideIcon
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <Card className={cardClass}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#B6F70B]/[0.12] text-[#B6F70B]">
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <Badge className="h-5 gap-0.5 rounded-full bg-[#B6F70B]/[0.12] px-2 text-[10px] font-bold text-[#B6F70B] hover:bg-[#B6F70B]/[0.12]">
            <ArrowUpRight className="h-3 w-3" />
            Live
          </Badge>
        </div>

        <p className="mt-3 text-[12px] font-medium text-gray-400">{label}</p>
        {value && (
          <p className="mt-0.5 text-[26px] leading-tight font-extrabold tracking-tight text-white">
            {value}
          </p>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

function StatCards({ stats }: { stats: AdminStats }) {
  const tutorShare =
    stats.totalUsers === 0 ? 0 : (stats.tutors / stats.totalUsers) * 100

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={UsersRound}
        label="Total Users"
        value={stats.totalUsers.toLocaleString("en-US")}
      >
        <div className="mt-3 flex items-center gap-4 border-t border-white/[0.06] pt-3">
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <UsersRound className="h-3.5 w-3.5 text-[#B6F70B]/70" />
            Students
            <b className="text-white">{stats.students.toLocaleString("en-US")}</b>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <GraduationCap className="h-3.5 w-3.5 text-[#B6F70B]/70" />
            Tutors
            <b className="text-white">{stats.tutors.toLocaleString("en-US")}</b>
          </span>
        </div>
      </StatCard>

      <StatCard
        icon={GraduationCap}
        label="Total Tutors"
        value={stats.tutors.toLocaleString("en-US")}
      >
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500">
            <span>Share of all users</span>
            <span className="text-[#B6F70B]">{tutorShare.toFixed(1)}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[#B6F70B]"
              style={{ width: `${tutorShare}%` }}
            />
          </div>
        </div>
      </StatCard>

      <StatCard icon={Layers3} label="Tuition Moderation">
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F5B849]" />
              Pending
            </span>
            <p className="mt-1 text-[22px] leading-none font-extrabold text-white">
              {stats.pending}
            </p>
          </div>
          <div className="border-l border-white/[0.06] pl-2">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B6F70B]" />
              Approved
            </span>
            <p className="mt-1 text-[22px] leading-none font-extrabold text-white">
              {stats.approved}
            </p>
          </div>
          <div className="border-l border-white/[0.06] pl-2">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              Declined
            </span>
            <p className="mt-1 text-[22px] leading-none font-extrabold text-white">
              {stats.declined}
            </p>
          </div>
        </div>
      </StatCard>

      <StatCard
        icon={BookOpen}
        label="Total Tuitions"
        value={stats.totalTuitions.toLocaleString("en-US")}
      >
        <div className="mt-3 flex items-center gap-4 border-t border-white/[0.06] pt-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#B6F70B]" />
            Published <b className="text-white">{stats.approved}</b>
          </span>
          <span className="flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-rose-400" />
            Hidden <b className="text-white">{stats.declined}</b>
          </span>
        </div>
      </StatCard>
    </section>
  )
}

function StatusPill({ status }: { status?: string }) {
  const value = (status || "pending").toLowerCase()
  const approved = value === "approved"
  const declined = value === "declined"

  return (
    <Badge
      className={cn(
        "h-5 rounded-full px-2 text-[10px] font-bold hover:bg-transparent",
        approved
          ? "bg-[#B6F70B]/[0.12] text-[#B6F70B]"
          : declined
            ? "bg-rose-500/10 text-rose-300"
            : "bg-[#F5B849]/[0.12] text-[#F5B849]"
      )}
    >
      {approved ? "Approved" : declined ? "Declined" : "Pending"}
    </Badge>
  )
}

function TuitionApprovalQueue({
  queue,
  busyId,
  onReview,
}: {
  queue: Tuition[]
  busyId: string | null
  onReview: (id: string, status: "approved" | "declined") => void
}) {
  return (
    <Card className={cardClass}>
      <PanelHeading icon={ClipboardCheck} href="/dashboard/admin/tuitions">
        Tuition Approval Queue
        <span className="ml-1 rounded-full bg-[#F5B849]/15 px-1.5 py-0.5 text-[10px] text-[#F5B849]">
          {queue.length}
        </span>
      </PanelHeading>
      <CardContent className="px-0 pb-1">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#B6F70B]/20 bg-[#B6F70B]/5">
              <CheckCircle2 className="h-5 w-5 text-[#B6F70B]" />
            </span>
            <p className="mt-3 text-[12px] font-bold text-white">All caught up</p>
            <p className="mt-1 text-[11px] text-gray-500">
              No pending tuitions need review right now.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-[11px]">
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="h-9 w-8 pl-4 text-[10px] font-semibold text-gray-500">#</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Tuition Title</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Tutor</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Subject / Class</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Submitted</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Status</TableHead>
                  <TableHead className="h-9 pr-4 text-[10px] font-semibold text-gray-500">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((row, index) => (
                  <TableRow key={row.id} className="border-white/[0.05] hover:bg-white/[0.02]">
                    <TableCell className="pl-4 text-gray-500">{index + 1}</TableCell>
                    <TableCell className="font-semibold text-white">{row.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm" className="h-7 w-7">
                          <AvatarFallback className="bg-[#B6F70B]/15 text-[9px] font-bold text-[#B6F70B]">
                            {initials(row.tutorName || "Tutor")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                          <p className="font-semibold text-white">
                            {row.tutorName || "Unknown tutor"}
                          </p>
                          <p className="text-[9px] text-gray-500">{row.tutorEmail || "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {row.subject}
                      <span className="block text-[9px] text-gray-600">
                        {row.classLevel}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={row.status} />
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="xs"
                          disabled={busyId === row.id}
                          onClick={() => onReview(row.id, "approved")}
                          className="h-6 gap-1 rounded-md bg-[#B6F70B]/[0.12] px-2 text-[10px] font-bold text-[#B6F70B] hover:bg-[#B6F70B]/20 disabled:opacity-40"
                        >
                          <Check className="h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          size="xs"
                          disabled={busyId === row.id}
                          onClick={() => onReview(row.id, "declined")}
                          className="h-6 gap-1 rounded-md bg-[#F43F5E]/10 px-2 text-[10px] font-bold text-[#FB7185] hover:bg-[#F43F5E]/20 disabled:opacity-40"
                        >
                          <X className="h-3 w-3" />
                          Decline
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Replaces the old hardcoded transactions table with real tuition records. */
function RecentTuitionActivity({ items }: { items: Tuition[] }) {
  return (
    <Card className={cardClass}>
      <PanelHeading
        icon={BookOpen}
        href="/dashboard/admin/tuitions"
        linkLabel="Browse Site"
      >
        Recent Tuition Activity
      </PanelHeading>
      <CardContent className="px-0 pb-1">
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-[11px] text-gray-500">
            No tuitions have been posted yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-[11px]">
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="h-9 pl-4 text-[10px] font-semibold text-gray-500">Title</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Tutor</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Subject</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Fee</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Submitted</TableHead>
                  <TableHead className="h-9 pr-4 text-[10px] font-semibold text-gray-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id} className="border-white/[0.05] hover:bg-white/[0.02]">
                    <TableCell className="pl-4 font-semibold text-white">{row.title}</TableCell>
                    <TableCell className="text-gray-400">{row.tutorName || "—"}</TableCell>
                    <TableCell className="text-gray-400">{row.subject}</TableCell>
                    <TableCell className="font-semibold text-white">
                      ${row.fee || "0"}
                    </TableCell>
                    <TableCell className="text-gray-400">{formatDate(row.createdAt)}</TableCell>
                    <TableCell className="pr-4">
                      <StatusPill status={row.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PlatformActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <Card className={cardClass}>
      <PanelHeading icon={Zap}>Platform Activity</PanelHeading>
      <CardContent className="px-4 py-1.5">
        {activities.length === 0 ? (
          <p className="py-10 text-center text-[11px] text-gray-500">
            No activity recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {activities.map((item) => {
              const approved = item.title.toLowerCase().includes("approved")
              const declined = item.title.toLowerCase().includes("declined")
              const Icon: LucideIcon = item.kind === "user"
                ? UserPlus
                : approved
                  ? CheckCircle2
                  : declined
                    ? XCircle
                    : BookOpen
              const iconClass = item.kind === "user"
                ? "bg-[#B6F70B]/12 text-[#B6F70B]"
                : approved
                  ? "bg-[#B6F70B]/12 text-[#B6F70B]"
                  : declined
                    ? "bg-rose-500/10 text-rose-300"
                    : "bg-[#38BDF8]/12 text-[#38BDF8]"

              return (
                <li key={item.id} className="flex items-start gap-3 py-3 first:pt-2 last:pb-2">
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      iconClass
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white">{item.title}</p>
                    <p className="mt-0.5 text-[10px] leading-snug text-gray-500">
                      {item.detail}
                    </p>
                  </div>
                  <span className="shrink-0 pt-0.5 text-[9px] whitespace-nowrap text-gray-600">
                    {item.time}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function UserRoleDistribution({
  slices,
  total,
}: {
  slices: RoleSlice[]
  total: number
}) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const colors = ["#B6F70B", "#7DB52E", "#5B686B"]
  const segments = slices.map((slice, index) => {
    const fractionOf = (item: RoleSlice) =>
      total === 0 ? 0 : item.count / total
    const length = fractionOf(slice) * circumference
    const start = slices
      .slice(0, index)
      .reduce((sum, item) => sum + fractionOf(item) * circumference, 0)
    return {
      ...slice,
      color: colors[index % colors.length],
      dash: `${length} ${circumference - length}`,
      offset: -start,
    }
  })

  return (
    <Card className={cardClass}>
      <CardHeader className="flex flex-row items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-[13px] font-bold text-white">
          <Layers3 className="h-4 w-4 text-[#B6F70B]" />
          User Role Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4 px-4 py-4">
        <div className="relative h-[124px] w-[124px] shrink-0">
          <svg viewBox="0 0 132 132" className="h-full w-full" aria-hidden="true">
            <g transform="rotate(-90 66 66)">
              <circle cx="66" cy="66" r={radius} fill="none" stroke="#253033" strokeWidth="13" />
              {segments.map((segment) => (
                <circle
                  key={segment.label}
                  cx="66"
                  cy="66"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="13"
                  strokeDasharray={segment.dash}
                  strokeDashoffset={segment.offset}
                />
              ))}
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[19px] leading-none font-extrabold text-white">
              {total.toLocaleString("en-US")}
            </span>
            <span className="mt-1 text-[10px] text-gray-500">Total Users</span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2.5">
          {slices.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", item.dot)} />
              <span className="min-w-0 flex-1 truncate text-[11px] text-gray-400">
                {item.label}
              </span>
              <span className="text-[11px] font-bold text-white">
                {item.count.toLocaleString("en-US")}
              </span>
              <span className="w-11 text-right text-[10px] text-gray-500">
                {item.percent}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

const EMPTY_OVERVIEW: AdminOverview = {
  stats: {
    totalUsers: 0,
    students: 0,
    tutors: 0,
    admins: 0,
    totalTuitions: 0,
    pending: 0,
    approved: 0,
    declined: 0,
  },
  queue: [],
  recentTuitions: [],
  recentUsers: [],
  roleDistribution: [],
  activities: [],
}

export default function AdminDashboardPage() {
  const [query, setQuery] = React.useState("")
  const [overview, setOverview] = React.useState<AdminOverview | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)

  const reload = () => {
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }

  React.useEffect(() => {
    let active = true

    fetch("/api/admin/overview", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load admin overview")
        return (await response.json()) as AdminOverview
      })
      .then((data) => {
        if (!active) return
        setOverview(data)
        setError(false)
      })
      .catch((loadError) => {
        console.error(loadError)
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [refreshKey])

  const handleReview = async (id: string, status: "approved" | "declined") => {
    setBusyId(id)
    try {
      await updateTuitionStatus(id, status)
      reload()
    } catch (actionError) {
      console.error(actionError)
      window.alert(
        actionError instanceof Error
          ? actionError.message
          : "Could not update the tuition."
      )
    } finally {
      setBusyId(null)
    }
  }

  const data = overview ?? EMPTY_OVERVIEW
  const queue = data.queue.filter((item) => {
    const needle = query.trim().toLowerCase()
    if (!needle) return true
    return [item.title, item.tutorName, item.tutorEmail, item.subject]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  })

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-[#080D0F] text-white sm:-mx-6 sm:-mt-6">
      {/* ---------- TOP BAR ---------- */}
      <div className="border-b border-white/[0.06] bg-[#0B1012] px-5 py-3 sm:px-7">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3">
          <button
            type="button"
            aria-label="Toggle menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>

          <div className="flex shrink-0 items-center gap-2 text-[13px]">
            <span className="text-gray-500">Dashboard</span>
            <span className="text-gray-700">/</span>
            <span className="font-semibold text-white">Overview</span>
          </div>

          <div className="ml-auto hidden w-full max-w-[340px] md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pending tuitions..."
                className="h-8 rounded-lg border-white/10 bg-[#141B1E] pr-3 pl-8 text-[11px] text-gray-300 placeholder:text-gray-600 focus-visible:border-[#B6F70B]/40 focus-visible:ring-[#B6F70B]/20"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={reload}
            disabled={loading}
            title="Refresh data"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#141B1E] text-gray-400 transition-colors hover:border-[#B6F70B]/40 hover:text-[#B6F70B] disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ---------- CONTENT ---------- */}
      <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-stretch gap-3">
            <span className="w-1 shrink-0 rounded-full bg-[#B6F70B]" />
            <div>
              <h1 className="text-[23px] leading-tight font-extrabold tracking-tight text-white">
                Platform Overview
              </h1>
              <p className="mt-1 text-[12px] text-gray-500">
                Manage users, tuitions, approvals and activity across Tutors —
                live from the database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-9 gap-2 rounded-lg border-white/10 bg-[#141B1E] px-3 text-[11px] font-semibold text-gray-300 hover:bg-[#1A2327] hover:text-white"
            >
              <CalendarDays className="h-4 w-4 text-gray-400" />
              All time
              <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
            </Button>
            <Button
              onClick={reload}
              disabled={loading}
              className="h-9 gap-2 rounded-lg bg-[#B6F70B] px-3.5 text-[11px] font-extrabold text-[#0B1100] shadow-[0_4px_16px_rgba(182,247,11,0.15)] hover:bg-[#C9FF42] disabled:opacity-60"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh Data
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-[11px] font-semibold text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Could not load dashboard data. Please try refreshing.
          </div>
        )}

        <div className="mt-5">
          <StatCards stats={data.stats} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4">
            <TuitionApprovalQueue
              queue={queue}
              busyId={busyId}
              onReview={handleReview}
            />
            <RecentTuitionActivity items={data.recentTuitions} />
          </div>
          <div className="min-w-0 space-y-4">
            <PlatformActivity activities={data.activities} />
            <UserRoleDistribution
              slices={data.roleDistribution}
              total={data.stats.totalUsers}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
