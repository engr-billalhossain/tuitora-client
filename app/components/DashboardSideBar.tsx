/* eslint-disable @next/next/no-img-element */
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { authClient, useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import {
  BookOpen,
  Bookmark,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  UserRound,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react"

/* ==========================================================================
   SHARED TYPES & HELPERS
   ========================================================================== */

type DashboardRole = "admin" | "teacher" | "student"

const DEFAULT_AVATAR = "/avater.png"

function normalizeRole(role?: string | null): DashboardRole {
  if (role === "admin") return "admin"
  if (role === "tutor" || role === "teacher") return "teacher"
  return "student"
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

const SidebarContext = React.createContext(false)

function useCollapsed() {
  return React.useContext(SidebarContext)
}

const mobileQuery = "(max-width: 767px)"

function subscribeToMobile(onChange: () => void) {
  const query = window.matchMedia(mobileQuery)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobile,
    () => window.matchMedia(mobileQuery).matches,
    () => false
  )
}

/* ==========================================================================
   SHADCN-BASED PRIMITIVES
   ========================================================================== */

function Avatar({
  src,
  name,
  className,
}: {
  src?: string | null
  name: string
  className: string
}) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  const [defaultFailed, setDefaultFailed] = React.useState(false)

  const primarySrc = src || DEFAULT_AVATAR
  const needFallback = primarySrc === DEFAULT_AVATAR || failedSrc === primarySrc
  const imageSrc = needFallback ? DEFAULT_AVATAR : primarySrc

  if (needFallback && defaultFailed) {
    return (
      <span
        className={cn(
          className,
          "flex items-center justify-center bg-gradient-to-br from-[#B6F70B] to-[#76B900] font-bold text-[#101418]"
        )}
      >
        {getInitials(name)}
      </span>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={name}
      onError={() => {
        if (imageSrc === DEFAULT_AVATAR) setDefaultFailed(true)
        else setFailedSrc(primarySrc)
      }}
      className={cn(className, "object-cover")}
    />
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
  const collapsed = useCollapsed()

  if (collapsed) return null

  return (
    <Link href="/" className="flex items-center gap-2 px-1">
      <GraduationCap
        className="h-8 w-8 shrink-0 text-[#B6F70B]"
        strokeWidth={2.2}
      />
      <div className="min-w-0">
        <p className="text-[19px] leading-none font-extrabold tracking-tight text-white">
          TUITORA
        </p>
        {!compact && (
          <p className="mt-1 text-[10px] leading-none text-gray-500">
            Tuition &amp; Mentorship Platform
          </p>
        )}
      </div>
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const collapsed = useCollapsed()

  if (collapsed) return null

  return (
    <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.12em] text-gray-500 uppercase">
      {children}
    </p>
  )
}

function NavItem({
  icon: Icon,
  label,
  href = "#",
  active = false,
  badge,
}: {
  icon: LucideIcon
  label: string
  href?: string
  active?: boolean
  badge?: number
}) {
  const collapsed = useCollapsed()

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex h-10 w-full items-center rounded-xl text-[13px] font-semibold transition-colors",
        collapsed ? "justify-center px-0" : "gap-3 px-3",
        active
          ? "bg-[#B6F70B] text-[#101418] shadow-[0_4px_16px_rgba(182,247,11,0.2)]"
          : "text-gray-300 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0",
          active ? "text-[#101418]" : "text-gray-400 group-hover:text-[#B6F70B]"
        )}
      />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge !== undefined && (
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold",
            active
              ? "bg-[#101418]/15 text-[#101418]"
              : "bg-[#B6F70B] text-[#101418]"
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}

function SignOutButton() {
  const router = useRouter()
  const collapsed = useCollapsed()
  const [signingOut, setSigningOut] = React.useState(false)

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await authClient.signOut()
      router.replace("/sign-in")
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSignOut}
      disabled={signingOut}
      title="Sign Out"
      className={cn(
        "h-10 w-full shrink-0 rounded-xl border border-white/[0.08] bg-[#1A2329] text-[12px] font-semibold text-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.18)] transition-all hover:border-white/20 hover:bg-[#222E35] hover:text-white",
        collapsed ? "justify-center px-0" : "justify-start gap-3 px-4"
      )}
    >
      <LogOut className="h-[16px] w-[16px] shrink-0 text-gray-300" />
      {!collapsed && <span>{signingOut ? "Signing out..." : "Sign Out"}</span>}
    </Button>
  )
}

function SidebarShell({
  children,
  brand,
  width = "w-[260px]",
}: {
  children: React.ReactNode
  brand?: React.ReactNode
  width?: string
}) {
  const [userCollapsed, setUserCollapsed] = React.useState<boolean | null>(null)
  const isMobile = useIsMobile()
  const collapsed = userCollapsed ?? isMobile

  const sidebarWidth = collapsed ? "w-[64px] sm:w-[68px]" : width

  return (
    <SidebarContext.Provider value={collapsed}>
      {/* Spacer keeps the fixed sidebar in the flex flow */}
      <div aria-hidden className={cn("shrink-0", sidebarWidth)} />

      <aside
        className={cn(
          "fixed top-[66px] left-0 z-40 flex h-[calc(100vh-66px)] flex-col border-r border-white/5 bg-[#0F1519] py-5 transition-[width] duration-300",
          sidebarWidth,
          collapsed ? "px-2" : "px-4"
        )}
      >
        {/* Header: brand (expanded only) + collapse toggle */}
        <div
          className={cn(
            "flex h-9 shrink-0 items-center",
            collapsed ? "justify-center" : "justify-between gap-2"
          )}
        >
          {!collapsed && brand}

          <button
            type="button"
            onClick={() => setUserCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#151D22] text-gray-400 transition-colors hover:border-[#B6F70B]/40 hover:text-[#B6F70B]"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {children}
      </aside>
    </SidebarContext.Provider>
  )
}

function UserPill({
  image,
  name,
  roleLabel,
  compact = false,
}: {
  image?: string | null
  name: string
  roleLabel: string
  compact?: boolean
}) {
  const collapsed = useCollapsed()

  return (
    <button
      type="button"
      title={collapsed ? name : undefined}
      className={cn(
        "flex w-full items-center rounded-2xl border border-white/10 bg-[#151D22] text-left transition-colors hover:border-white/20",
        collapsed
          ? "justify-center p-2"
          : cn(compact ? "mt-5 gap-2 p-2" : "gap-3 p-3")
      )}
    >
      <Avatar
        src={image}
        name={name}
        className={cn(
          "shrink-0 rounded-full",
          compact ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs"
        )}
      />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate font-bold text-white",
                compact ? "text-[12px]" : "text-[13px]"
              )}
            >
              {name}
            </span>
            <span
              className={cn(
                "block truncate",
                compact
                  ? "text-[10px] font-semibold text-[#B6F70B]"
                  : "text-[11px] text-gray-400"
              )}
            >
              {roleLabel}
            </span>
          </span>
          {compact ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
          ) : (
            <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
          )}
        </>
      )}
    </button>
  )
}

/* ==========================================================================
   1️⃣ ADMIN SIDEBAR  —  full platform management
   ========================================================================== */

export function AdminSidebar() {
  const { data: session } = useSession()
  const user = session?.user
  const name = user?.name?.trim() || "Admin Ruhan"

  return (
    <SidebarShell brand={<Brand />} width="w-[220px] lg:w-[260px]">
      <nav className="mt-7 min-h-0 flex-1 space-y-7 overflow-y-auto">
        <div className="space-y-1">
          <SectionLabel>Overview</SectionLabel>
          <NavItem
            icon={LayoutDashboard}
            label="Dashboard"
            href="/dashboard/admin"
            active
          />
        </div>

        <div className="space-y-1">
          <SectionLabel>Platform Management</SectionLabel>
          <NavItem icon={UsersRound} label="Users & Roles" />
          <NavItem icon={ClipboardCheck} label="Tuition Approvals" />
          <NavItem icon={CreditCard} label="Transactions" />
        </div>

        <div className="space-y-1">
          <SectionLabel>Account</SectionLabel>
          <NavItem icon={UserRound} label="Profile" />
          <NavItem icon={Settings} label="Settings" />
        </div>
      </nav>

      <div className="shrink-0 space-y-3">
        <Separator className="bg-white/10" />

        <UserPill image="/admin.png" name={name} roleLabel="Administrator" />

        <SignOutButton />
      </div>
    </SidebarShell>
  )
}

/* ==========================================================================
   2️⃣ STUDENT SIDEBAR  —  compact, learning focused
   ========================================================================== */

export function StudentSidebar() {
  const { data: session } = useSession()
  const user = session?.user
  const name = user?.name?.trim() || "Student"

  return (
    <SidebarShell brand={<Brand compact />} width="w-[200px] lg:w-[230px]">
      <UserPill image={user?.image} name={name} roleLabel="Student" compact />

      <nav className="mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto">
        <NavItem
          icon={LayoutDashboard}
          label="Dashboard"
          href="/dashboard/student"
          active
        />
        <NavItem icon={Search} label="Find Tuitions" />
        <NavItem icon={FileText} label="My Applications" />
        <NavItem icon={UserRound} label="My Profile" />
      </nav>

      <div className="shrink-0 space-y-3">
        <Separator className="bg-white/10" />
        <SignOutButton />
      </div>
    </SidebarShell>
  )
}

/* ==========================================================================
   3️⃣ TEACHER / TUTOR SIDEBAR  —  compact, teaching focused
   ========================================================================== */

export function TeacherSidebar() {
  const { data: session } = useSession()
  const user = session?.user
  const name = user?.name?.trim() || "Tutor"

  return (
    <SidebarShell brand={<Brand compact />} width="w-[200px] lg:w-[230px]">
      <UserPill image={user?.image} name={name} roleLabel="Tutor" compact />

      <nav className="mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto">
        <NavItem
          icon={LayoutDashboard}
          label="Dashboard"
          href="/dashboard/teacher"
          active
        />
        <NavItem icon={BookOpen} label="My Tuitions" />
        <NavItem icon={ClipboardCheck} label="Applications" />
        <NavItem icon={Wallet} label="Earnings" />
        <NavItem icon={MessageCircle} label="Messages" />
        <NavItem icon={UserRound} label="My Profile" />
      </nav>

      <div className="shrink-0 space-y-3">
        <Separator className="bg-white/10" />
        <SignOutButton />
      </div>
    </SidebarShell>
  )
}

/* ==========================================================================
   ROLE-AWARE SWITCHER + ROUTE GUARD
   ========================================================================== */

export function DashboardSideBar({ role }: { role: DashboardRole }) {
  if (role === "admin") return <AdminSidebar />
  if (role === "teacher") return <TeacherSidebar />
  return <StudentSidebar />
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  const role = normalizeRole(session?.user?.role)
  const routeRole = pathname.split("/")[2]

  React.useEffect(() => {
    if (isPending) return
    if (!session?.user) {
      router.replace("/sign-in")
      return
    }
    if (routeRole && routeRole !== role) {
      router.replace(`/dashboard/${role}`)
    }
  }, [isPending, session?.user, routeRole, role, router])

  if (isPending || !session?.user) return null

  return (
    <div className="flex min-h-screen bg-[#F3F7F1] dark:bg-[#080D0F]">
      <DashboardSideBar role={role} />
      <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
    </div>
  )
}
