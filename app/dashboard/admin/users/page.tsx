"use client"

import * as React from "react"
import {
  AlertCircle,
  ChevronDown,
  GraduationCap,
  Mail,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

/* ============================================================================
   Data comes from GET /api/admin/users (MongoDB). Roles are changed through
   PATCH /api/admin/users. The layout mirrors the dark admin dashboard theme.
   ========================================================================== */

type Role = "student" | "tutor" | "admin"

type AdminUser = {
  id: string
  name: string
  email: string
  role: Role
  plan: string
  createdAt?: string
}

const ROLES: { value: Role; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "tutor", label: "Tutor" },
  { value: "admin", label: "Admin" },
]

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

function RolePill({ role }: { role: Role }) {
  const config: Record<
    Role,
    { label: string; className: string; icon: typeof UserRound }
  > = {
    student: {
      label: "Student",
      className: "border-sky-400/25 bg-sky-400/10 text-sky-300",
      icon: UserRound,
    },
    tutor: {
      label: "Tutor",
      className: "border-teal-400/25 bg-teal-400/10 text-teal-300",
      icon: GraduationCap,
    },
    admin: {
      label: "Admin",
      className: "border-[#B6F70B]/25 bg-[#B6F70B]/10 text-[#B6F70B]",
      icon: ShieldCheck,
    },
  }

  const { label, className, icon: Icon } = config[role] ?? config.student

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function RoleSelect({
  value,
  disabled,
  onChange,
}: {
  value: Role
  disabled?: boolean
  onChange: (role: Role) => void
}) {
  return (
    <div className="relative inline-flex">
      <select
        aria-label="Change role"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as Role)}
        className={cn(
          "h-8 w-[112px] cursor-pointer appearance-none rounded-lg border border-white/12 bg-[#141B1E] pr-7 pl-3 text-[11px] font-semibold text-white outline-none transition-colors hover:border-[#B6F70B]/40 focus:border-[#B6F70B]/60 disabled:cursor-wait disabled:opacity-50"
        )}
      >
        {ROLES.map((item) => (
          <option key={item.value} value={item.value} className="bg-[#141B1E]">
            {item.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)

  const reload = () => setRefreshKey((key) => key + 1)

  React.useEffect(() => {
    let active = true

    fetch("/api/admin/users", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load users")
        return (await response.json()) as { users: AdminUser[] }
      })
      .then((data) => {
        if (!active) return
        setUsers(data.users)
        setError("")
      })
      .catch((loadError) => {
        console.error(loadError)
        if (active) {
          const message = "Could not load users. Please try refreshing."
          setError(message)
          toast.error(message)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [refreshKey])

  const handleRoleChange = async (user: AdminUser, role: Role) => {
    if (role === user.role || busyId) return

    setBusyId(user.id)
    setError("")
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, role }),
      })
      const result = (await response.json()) as {
        user?: AdminUser
        error?: string
      }
      if (!response.ok || !result.user) {
        throw new Error(result.error || "Could not update the role")
      }

      setUsers((current) =>
        current.map((item) => (item.id === user.id ? result.user! : item))
      )
      toast.success(`${user.name} is now a ${ROLES.find((r) => r.value === role)?.label}`)
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? actionError.message
          : "Could not update the role"
      setError(message)
      toast.error(message)
    } finally {
      setBusyId(null)
    }
  }

  const filtered = users.filter((user) => {
    const needle = query.trim().toLowerCase()
    if (!needle) return true
    return [user.name, user.email, user.role, user.plan]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  })

  const countByRole = (role: Role) =>
    users.filter((user) => user.role === role).length

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
            <span className="text-gray-500">Admin</span>
            <span className="text-gray-700">/</span>
            <span className="font-semibold text-white">Users &amp; Roles</span>
          </div>

          <div className="ml-auto hidden w-full max-w-[300px] md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search users..."
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
                Users &amp; Roles
              </h1>
              <p className="mt-1 text-[12px] text-gray-500">
                Manage every account on the platform and update user roles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-white/[0.08] bg-[#11181B] px-3 py-2 text-[11px] font-semibold text-gray-400">
              Total <b className="ml-1 text-white">{users.length}</b>
            </span>
            <span className="rounded-lg border border-sky-400/20 bg-sky-400/5 px-3 py-2 text-[11px] font-semibold text-sky-300">
              Students <b className="ml-1">{countByRole("student")}</b>
            </span>
            <span className="rounded-lg border border-teal-400/20 bg-teal-400/5 px-3 py-2 text-[11px] font-semibold text-teal-300">
              Tutors <b className="ml-1">{countByRole("tutor")}</b>
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-[11px] font-semibold text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ---------- USERS TABLE ---------- */}
        <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0F1519]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#141B1E]">
                  <th className="px-5 py-3.5 text-[10px] font-bold tracking-[0.12em] text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-bold tracking-[0.12em] text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-bold tracking-[0.12em] text-gray-500 uppercase">
                    Current Role
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-bold tracking-[0.12em] text-gray-500 uppercase">
                    Plan
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-bold tracking-[0.12em] text-gray-500 uppercase">
                    Joined Date
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-bold tracking-[0.12em] text-gray-500 uppercase">
                    Change Role
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-[12px] text-gray-500">
                      <RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin text-[#B6F70B]" />
                      Loading users...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-[12px] text-gray-500">
                      {query ? "No users match your search." : "No users have registered yet."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 text-[12px] font-extrabold text-white">
                            {initials(user.name)}
                          </span>
                          <span className="text-[13px] font-bold text-white">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-[12px] text-gray-400">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-gray-600" />
                          {user.email || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <RolePill role={user.role} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex h-6 items-center rounded-full border border-white/12 px-2.5 text-[10px] font-bold tracking-wide text-gray-400">
                          {user.plan.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[12px] text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <RoleSelect
                          value={user.role}
                          disabled={busyId === user.id}
                          onChange={(role) => handleRoleChange(user, role)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-gray-600">
          Showing {filtered.length} of {users.length} users · Roles update instantly in the database.
        </p>
      </div>
    </div>
  )
}
