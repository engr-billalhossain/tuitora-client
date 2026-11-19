"use client"

import * as React from "react"
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  Download,
  GraduationCap,
  Layers3,
  Menu,
  Search,
  UserPlus,
  UsersRound,
  Wallet,
  X,
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

/* ============================================================================
   🔌 DYNAMIC DATA — SOURCE GUIDE
   ----------------------------------------------------------------------------
   Ekhon shob gulo dummy data. Backend connect korar somoy nicher const guloke
   API response diye replace korun (eva state/props hishebe pass korun).

   GET /api/admin/overview              -> overviewStats (stat cards)
   GET /api/admin/tuitions?status=pending -> tuitionQueue  (approval queue)
   GET /api/admin/transactions          -> transactions   (recent transactions)
   GET /api/admin/activity              -> activities     (platform activity)
   GET /api/admin/users/role-distribution -> roleDistribution (donut chart)
   ========================================================================== */

// 🔌 DYNAMIC: GET /api/admin/overview — date range loop e API query parameter hishebe pathano hobe.
const overviewStats = {
  totalUsers: 12_840,
  usersChange: "+12.5%",
  students: 10_280,
  tutors: 2_560,
  tutorsChange: "+8.4%",
  moderationPending: 18,
  moderationApproved: 342,
  stripeRevenue: "$24,680",
  revenueChange: "+8.7%",
}

// 🔌 DYNAMIC: GET /api/admin/tuitions?status=pending — approve/reject e POST/PATCH call hobe.
type TuitionRow = {
  id: number
  title: string
  tutor: string
  email: string
  subject: string
  submitted: string
}

const tuitionQueue: TuitionRow[] = [
  {
    id: 1,
    title: "HSC Physics - Full Course",
    tutor: "Md. Rake Khan",
    email: "rake.khan@tuitora.com",
    subject: "Physics - HSC",
    submitted: "Nov 18, 2026",
  },
  {
    id: 2,
    title: "Class 8 Math (Bangla Medium)",
    tutor: "Afroz Jahan",
    email: "afroz.jahan@tuitora.com",
    subject: "Math - Class 8",
    submitted: "Nov 18, 2026",
  },
  {
    id: 3,
    title: "English for IELTS (Basics)",
    tutor: "Nurod Hasan",
    email: "nurod.hasan@tuitora.com",
    subject: "English - IELTS",
    submitted: "Nov 16, 2026",
  },
  {
    id: 4,
    title: "Class 10 Chemistry",
    tutor: "Sadia Islam",
    email: "sadia.islam@tuitora.com",
    subject: "Chemistry - Class 10",
    submitted: "Nov 18, 2026",
  },
  {
    id: 5,
    title: "Admission - Varsity Math",
    tutor: "Tanjim Alam",
    email: "tanjim.alam@tuitora.com",
    subject: "Math - Admission",
    submitted: "Nov 17, 2026",
  },
]

// 🔌 DYNAMIC: GET /api/admin/transactions — stripe webhook/DB theke paid transactions asbe.
type TransactionRow = {
  id: number
  user: string
  email: string
  role: "Student" | "Tutor"
  plan: string
  amount: string
  txnId: string
  date: string
  status: "Paid"
}

const transactions: TransactionRow[] = [
  {
    id: 1,
    user: "Rafsan Uddin",
    email: "rafsan.uddin@example.com",
    role: "Student",
    plan: "Pro (Monthly)",
    amount: "$9.90",
    txnId: "pi_3Qw7zK...8wdf",
    date: "Nov 19, 2026",
    status: "Paid",
  },
  {
    id: 2,
    user: "Sumaiya Akter",
    email: "sumaiya.akter@example.com",
    role: "Tutor",
    plan: "Pro (Monthly)",
    amount: "$9.90",
    txnId: "pi_3Qw7z...9dhn",
    date: "Nov 18, 2026",
    status: "Paid",
  },
  {
    id: 3,
    user: "Arif Hossain",
    email: "arif.hossain@example.com",
    role: "Student",
    plan: "Pro (Yearly)",
    amount: "$99.00",
    txnId: "pi_3Qw7zK...2a9d",
    date: "Nov 17, 2026",
    status: "Paid",
  },
  {
    id: 4,
    user: "Jubaid Hasan",
    email: "jubaid.hasan@example.com",
    role: "Student",
    plan: "Pro (Monthly)",
    amount: "$9.90",
    txnId: "pi_3Qw7z...7hjk",
    date: "Nov 17, 2026",
    status: "Paid",
  },
  {
    id: 5,
    user: "Nusrat Jahan",
    email: "nusrat.jahan@example.com",
    role: "Tutor",
    plan: "Pro (Monthly)",
    amount: "$9.90",
    txnId: "pi_3Qw7z...4vPr",
    date: "Nov 15, 2026",
    status: "Paid",
  },
]

// 🔌 DYNAMIC: GET /api/admin/activity — realtime activity feed (websocket/polling) hote pare.
type ActivityItem = {
  id: number
  icon: LucideIcon
  iconClass: string
  title: string
  detail: string
  time: string
}

const activities: ActivityItem[] = [
  {
    id: 1,
    icon: UserPlus,
    iconClass: "bg-[#B6F70B]/12 text-[#B6F70B]",
    title: "New user registered",
    detail: "Rafsan Uddin joined the platform.",
    time: "2 min ago",
  },
  {
    id: 2,
    icon: BookOpen,
    iconClass: "bg-[#38BDF8]/12 text-[#38BDF8]",
    title: "New tuition submitted",
    detail: "HSC Physics - Full Course by Tanvir Akter.",
    time: "12 min ago",
  },
  {
    id: 3,
    icon: CreditCard,
    iconClass: "bg-[#A78BFA]/12 text-[#A78BFA]",
    title: "Pro subscription purchased",
    detail: "Rafsan Uddin upgraded to Pro Plan.",
    time: "28 min ago",
  },
  {
    id: 4,
    icon: GraduationCap,
    iconClass: "bg-[#F5B849]/12 text-[#F5B849]",
    title: "New tutor registered",
    detail: "Samiya Akter (Tutor) joined the platform.",
    time: "42 min ago",
  },
]

// 🔌 DYNAMIC: GET /api/admin/users/role-distribution — count + percentage backend theke asbe.
const roleDistribution = [
  { label: "Students", count: "10,280", percent: "80.1%", dot: "bg-[#B6F70B]" },
  { label: "Tutors", count: "2,560", percent: "20.0%", dot: "bg-[#7DB52E]" },
  { label: "Admins", count: "12", percent: "0.1%", dot: "bg-[#5B686B]" },
]

/* ============================================================================
   SMALL SHARED UI HELPERS
   ========================================================================== */

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
      {/* 🔌 DYNAMIC: ei link gulo route e badhano hobe (e.g. /dashboard/admin/tuitions). */}
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

/* ============================================================================
   STAT CARDS
   ========================================================================== */

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  children,
}: {
  icon: LucideIcon
  label: string
  value?: string
  change?: string
  children?: React.ReactNode
}) {
  return (
    <Card className={cardClass}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#B6F70B]/[0.12] text-[#B6F70B]">
            <Icon className="h-[18px] w-[18px]" />
          </div>
          {change && (
            <Badge className="h-5 gap-0.5 rounded-full bg-[#B6F70B]/[0.12] px-2 text-[10px] font-bold text-[#B6F70B] hover:bg-[#B6F70B]/[0.12]">
              <ArrowUpRight className="h-3 w-3" />
              {change}
            </Badge>
          )}
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

function StatCards() {
  return (
    // 🔌 DYNAMIC: overviewStats object API response diye replace korun.
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={UsersRound}
        label="Total Users"
        value={overviewStats.totalUsers.toLocaleString("en-US")}
        change={overviewStats.usersChange}
      >
        <div className="mt-3 flex items-center gap-4 border-t border-white/[0.06] pt-3">
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <UsersRound className="h-3.5 w-3.5 text-[#B6F70B]/70" />
            Students
            <b className="text-white">{overviewStats.students.toLocaleString("en-US")}</b>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <GraduationCap className="h-3.5 w-3.5 text-[#B6F70B]/70" />
            Tutors
            <b className="text-white">{overviewStats.tutors.toLocaleString("en-US")}</b>
          </span>
        </div>
      </StatCard>

      <StatCard
        icon={GraduationCap}
        label="Total Tutors"
        value={overviewStats.tutors.toLocaleString("en-US")}
        change={overviewStats.tutorsChange}
      >
        {/* 🔌 DYNAMIC: sparkline data (last 30 days tutor growth) API theke asbe. */}
        <svg
          viewBox="0 0 200 42"
          preserveAspectRatio="none"
          className="mt-2 h-10 w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="tutorSparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B6F70B" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#B6F70B" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 34 C 18 33, 28 26, 44 29 S 70 19, 86 23 S 110 11, 126 15 S 152 5, 168 9 S 188 2, 200 3 L200 42 L0 42 Z"
            fill="url(#tutorSparkFill)"
          />
          <path
            d="M0 34 C 18 33, 28 26, 44 29 S 70 19, 86 23 S 110 11, 126 15 S 152 5, 168 9 S 188 2, 200 3"
            fill="none"
            stroke="#B6F70B"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </StatCard>

      <StatCard icon={Layers3} label="Tuition Moderation">
        {/* 🔌 DYNAMIC: pending/approved count API theke asbe. */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F5B849]" />
              Pending
            </span>
            <p className="mt-1 text-[22px] leading-none font-extrabold text-white">
              {overviewStats.moderationPending}
            </p>
          </div>
          <div className="border-l border-white/[0.06] pl-3">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B6F70B]" />
              Approved
            </span>
            <p className="mt-1 text-[22px] leading-none font-extrabold text-white">
              {overviewStats.moderationApproved}
            </p>
          </div>
        </div>
      </StatCard>

      <StatCard
        icon={Wallet}
        label="Total Stripe Revenue"
        value={overviewStats.stripeRevenue}
        change={overviewStats.revenueChange}
      >
        {/* 🔌 DYNAMIC: revenue bar chart data (monthly/daily) API theke asbe. */}
        <div className="mt-3 flex h-10 items-end gap-[3px]">
          {[24, 36, 30, 48, 42, 58, 50, 70, 62, 84, 76, 100].map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-sm bg-[#B6F70B]/80"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </StatCard>
    </section>
  )
}

/* ============================================================================
   TUITION APPROVAL QUEUE
   ========================================================================== */

function TuitionApprovalQueue() {
  return (
    <Card className={cardClass}>
      <PanelHeading icon={ClipboardCheck}>Tuition Approval Queue</PanelHeading>
      <CardContent className="px-0 pb-1">
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
            {tuitionQueue.map((row) => (
              <TableRow key={row.id} className="border-white/[0.05] hover:bg-white/[0.02]">
                <TableCell className="pl-4 text-gray-500">{row.id}</TableCell>
                <TableCell className="font-semibold text-white">{row.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar size="sm" className="h-7 w-7">
                      <AvatarFallback className="bg-[#B6F70B]/15 text-[9px] font-bold text-[#B6F70B]">
                        {initials(row.tutor)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <p className="font-semibold text-white">{row.tutor}</p>
                      <p className="text-[9px] text-gray-500">{row.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-400">{row.subject}</TableCell>
                <TableCell className="text-gray-400">{row.submitted}</TableCell>
                <TableCell>
                  <Badge className="h-5 rounded-full bg-[#F5B849]/[0.12] px-2 text-[10px] font-bold text-[#F5B849] hover:bg-[#F5B849]/[0.12]">
                    Pending
                  </Badge>
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center gap-1.5">
                    {/* 🔌 DYNAMIC: PATCH /api/admin/tuitions/:id/approve */}
                    <Button
                      size="xs"
                      className="h-6 gap-1 rounded-md bg-[#B6F70B]/[0.12] px-2 text-[10px] font-bold text-[#B6F70B] hover:bg-[#B6F70B]/20"
                    >
                      <Check className="h-3 w-3" />
                      Approve
                    </Button>
                    {/* 🔌 DYNAMIC: PATCH /api/admin/tuitions/:id/reject */}
                    <Button
                      size="xs"
                      className="h-6 gap-1 rounded-md bg-[#F43F5E]/10 px-2 text-[10px] font-bold text-[#FB7185] hover:bg-[#F43F5E]/20"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/* ============================================================================
   RECENT TRANSACTIONS
   ========================================================================== */

function RecentTransactions() {
  return (
    <Card className={cardClass}>
      <PanelHeading icon={CreditCard} href="#" linkLabel="View All Transactions">
        Recent Transactions
      </PanelHeading>
      <CardContent className="px-0 pb-1">
        <Table className="text-[11px]">
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className="h-9 w-8 pl-4 text-[10px] font-semibold text-gray-500">#</TableHead>
              <TableHead className="h-9 text-[10px] font-semibold text-gray-500">User</TableHead>
              <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Role</TableHead>
              <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Plan Name</TableHead>
              <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Amount</TableHead>
              <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Transaction ID</TableHead>
              <TableHead className="h-9 text-[10px] font-semibold text-gray-500">Payment Date</TableHead>
              <TableHead className="h-9 pr-4 text-[10px] font-semibold text-gray-500">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((row) => (
              <TableRow key={row.id} className="border-white/[0.05] hover:bg-white/[0.02]">
                <TableCell className="pl-4 text-gray-500">{row.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar size="sm" className="h-7 w-7">
                      <AvatarFallback className="bg-white/[0.06] text-[9px] font-bold text-gray-300">
                        {initials(row.user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <p className="font-semibold text-white">{row.user}</p>
                      <p className="text-[9px] text-gray-500">{row.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "h-5 rounded-full px-2 text-[10px] font-bold hover:bg-transparent",
                      row.role === "Student"
                        ? "bg-[#B6F70B]/[0.12] text-[#B6F70B]"
                        : "bg-[#F5B849]/[0.12] text-[#F5B849]"
                    )}
                  >
                    {row.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-300">{row.plan}</TableCell>
                <TableCell className="font-semibold text-white">{row.amount}</TableCell>
                <TableCell className="font-mono text-[10px] text-gray-400">{row.txnId}</TableCell>
                <TableCell className="text-gray-400">{row.date}</TableCell>
                <TableCell className="pr-4">
                  <Badge className="h-5 gap-1 rounded-full bg-[#B6F70B]/[0.12] px-2 text-[10px] font-bold text-[#B6F70B] hover:bg-[#B6F70B]/[0.12]">
                    <CheckCircle2 className="h-3 w-3" />
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/* ============================================================================
   PLATFORM ACTIVITY
   ========================================================================== */

function PlatformActivity() {
  return (
    <Card className={cardClass}>
      <PanelHeading icon={Zap}>Platform Activity</PanelHeading>
      <CardContent className="px-4 py-1.5">
        <ul className="divide-y divide-white/[0.05]">
          {activities.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id} className="flex items-start gap-3 py-3 first:pt-2 last:pb-2">
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    item.iconClass
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-white">{item.title}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-gray-500">{item.detail}</p>
                </div>
                <span className="shrink-0 pt-0.5 text-[9px] whitespace-nowrap text-gray-600">
                  {item.time}
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

/* ============================================================================
   USER ROLE DISTRIBUTION (donut chart)
   ========================================================================== */

function UserRoleDistribution() {
  return (
    <Card className={cardClass}>
      <CardHeader className="flex flex-row items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-[13px] font-bold text-white">
          <Layers3 className="h-4 w-4 text-[#B6F70B]" />
          User Role Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4 px-4 py-4">
        {/* 🔌 DYNAMIC: donut percentage gulo roleDistribution API theke calculate kore draw korun. */}
        <div className="relative h-[124px] w-[124px] shrink-0">
          <svg viewBox="0 0 132 132" className="h-full w-full" aria-hidden="true">
            <g transform="rotate(-90 66 66)">
              <circle cx="66" cy="66" r="52" fill="none" stroke="#253033" strokeWidth="13" />
              <circle
                cx="66"
                cy="66"
                r="52"
                fill="none"
                stroke="#B6F70B"
                strokeWidth="13"
                strokeDasharray="261.7 326.7"
              />
              <circle
                cx="66"
                cy="66"
                r="52"
                fill="none"
                stroke="#7DB52E"
                strokeWidth="13"
                strokeDasharray="65 326.7"
                strokeDashoffset="-261.7"
              />
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[19px] leading-none font-extrabold text-white">
              {overviewStats.totalUsers.toLocaleString("en-US")}
            </span>
            <span className="mt-1 text-[10px] text-gray-500">Total Users</span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2.5">
          {roleDistribution.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", item.dot)} />
              <span className="min-w-0 flex-1 truncate text-[11px] text-gray-400">{item.label}</span>
              <span className="text-[11px] font-bold text-white">{item.count}</span>
              <span className="w-10 text-right text-[10px] text-gray-500">{item.percent}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/* ============================================================================
   PAGE
   ========================================================================== */

export default function AdminDashboardPage() {
  const [query, setQuery] = React.useState("")

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-[#080D0F] text-white sm:-mx-6 sm:-mt-6">
      {/* ---------- TOP BAR ---------- */}
      {/* 🔌 DYNAMIC: global search API. */}
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
                placeholder="Search users, tuitions, transactions..."
                className="h-8 rounded-lg border-white/10 bg-[#141B1E] pr-12 pl-8 text-[11px] text-gray-300 placeholder:text-gray-600 focus-visible:border-[#B6F70B]/40 focus-visible:ring-[#B6F70B]/20"
              />
              <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] text-gray-500">
                ⌘ K
              </kbd>
            </div>
          </div>

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
                Manage users, tuitions, approvals and payments across Tutors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 🔌 DYNAMIC: date range state + backend query parameter ("from" & "to"). */}
            <Button
              variant="outline"
              className="h-9 gap-2 rounded-lg border-white/10 bg-[#141B1E] px-3 text-[11px] font-semibold text-gray-300 hover:bg-[#1A2327] hover:text-white"
            >
              <CalendarDays className="h-4 w-4 text-gray-400" />
              Nov 1, 2026 – Nov 19, 2026
              <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
            </Button>
            {/* 🔌 DYNAMIC: Export Report = backend export API call (CSV/PDF download). */}
            <Button className="h-9 gap-2 rounded-lg bg-[#B6F70B] px-3.5 text-[11px] font-extrabold text-[#0B1100] shadow-[0_4px_16px_rgba(182,247,11,0.15)] hover:bg-[#C9FF42]">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <StatCards />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4">
            <TuitionApprovalQueue />
            <RecentTransactions />
          </div>
          <div className="min-w-0 space-y-4">
            <PlatformActivity />
            <UserRoleDistribution />
          </div>
        </div>
      </div>
    </div>
  )
}
