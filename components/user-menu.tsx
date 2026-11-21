/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { clearAuthToken } from "@/lib/auth-token"
import { isProValue } from "@/lib/plans"

import {
  ChevronDown,
  ChevronRight,
  Crown,
  GraduationCap,
  LogOut,
  Mail,
  Settings,
  UserRound,
} from "lucide-react"

type MenuUser = {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
  plan?: string | null
}

function dashboardHref(role?: string | null) {
  if (role === "admin") return "/dashboard/admin"
  if (role === "tutor" || role === "teacher") return "/dashboard/tutor"
  return "/dashboard/student"
}

const menuItems = [
  { label: "Dashboard", href: dashboardHref, icon: Settings },
  { label: "Update Profile", href: () => "/dashboard/profile", icon: UserRound },
]

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

const DEFAULT_AVATAR = "/avater.png"

function Avatar({
  src,
  name,
  className,
}: {
  src?: string | null
  name: string
  className: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const [defaultFailed, setDefaultFailed] = useState(false)

  const primarySrc = src || DEFAULT_AVATAR
  const needFallback = primarySrc === DEFAULT_AVATAR || failedSrc === primarySrc
  const imageSrc = needFallback ? DEFAULT_AVATAR : primarySrc

  if (needFallback && defaultFailed) {
    return (
      <span
        className={`${className} flex items-center justify-center bg-gradient-to-br from-[#B6F70B] to-[#76B900] font-bold text-[#101418]`}
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
        if (imageSrc === DEFAULT_AVATAR) {
          setDefaultFailed(true)
        } else {
          setFailedSrc(primarySrc)
        }
      }}
      className={`${className} object-cover`}
    />
  )
}

export function UserMenu({ user }: { user: MenuUser }) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!open) return

    function handleOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handleOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const handleSignOut = async () => {
    if (signingOut) return

    setSigningOut(true)

    try {
      await authClient.signOut()
      clearAuthToken()
      toast.success("Signed out successfully")
      setOpen(false)
      router.push("/")
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  const name = user.name?.trim() || "User"
  const isPro = isProValue(user.plan)
  const roleLabel =
    user.role === "admin"
      ? "Admin"
      : user.role === "tutor" || user.role === "teacher"
        ? "Tutor"
        : "Student"
  const avatarSrc = user.role === "admin" ? "/admin.png" : user.image

  return (
    <div ref={containerRef} className="relative">
      {/* ---------- TRIGGER ---------- */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Open profile menu for ${name}`}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pr-3 pl-1.5 shadow-sm transition-all duration-200 hover:border-[#B6F70B] hover:shadow-md dark:border-white/10 dark:bg-[#11191C]"
      >
        <span className="relative shrink-0">
          <Avatar
            src={avatarSrc}
            name={name}
            className="h-8 w-8 rounded-full text-[11px]"
          />
          <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#4ADE80] dark:border-[#11191C]" />
        </span>

        <span className="max-w-[110px] truncate text-[13px] font-bold text-[#101418] dark:text-white">
          {name}
        </span>

        <span className="hidden shrink-0 rounded-full bg-[#E7FA9E] px-2 py-0.5 text-[10px] font-bold text-[#3F5A00] sm:inline dark:bg-[#B6F70B]/15 dark:text-[#B6F70B]">
          {roleLabel}
        </span>

        {isPro && (
          <span className="shrink-0 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-[#B8860B] dark:text-[#E8C34A]">
            PRO
          </span>
        )}

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ---------- DROPDOWN ---------- */}
      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+14px)] right-0 z-50 w-[320px] overflow-hidden rounded-[26px] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(16,20,24,0.16)] sm:w-[330px] dark:border-white/10 dark:bg-[#11191C]"
        >
          {/* Arrow pointing to trigger */}
          <span className="absolute -top-2 right-9 h-4 w-4 rotate-45 border-t border-l border-gray-100 bg-white dark:border-white/10 dark:bg-[#11191C]" />

          {/* Green glow */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 overflow-hidden rounded-t-[26px]">
            <div className="absolute -top-20 -right-10 h-44 w-44 rounded-full bg-[#B6F70B]/25 blur-3xl" />
            <div className="absolute -top-24 right-16 h-36 w-36 rounded-full bg-[#B6F70B]/20 blur-2xl" />
          </div>

          <div className="relative px-5 pt-6 pb-5">
            {/* Profile header */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar
                  src={avatarSrc}
                  name={name}
                  className="h-[74px] w-[74px] rounded-full text-xl ring-[3px] ring-[#B6F70B] ring-offset-2 ring-offset-white dark:ring-offset-[#11191C]"
                />
                <span className="absolute -right-0.5 bottom-1 h-4 w-4 rounded-full border-[3px] border-white bg-[#4ADE80] dark:border-[#11191C]" />
              </div>

              <h3 className="mt-3 text-[21px] leading-tight font-extrabold text-[#101418] dark:text-white">
                {name}
              </h3>

              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#E7FA9E] px-3 py-1 text-[11px] font-bold text-[#3F5A00] dark:bg-[#B6F70B]/15 dark:text-[#B6F70B]">
                <GraduationCap className="h-3.5 w-3.5" />
                {roleLabel}
              </span>

              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold ${
                  isPro
                    ? "border border-[#C9A227]/40 bg-[#C9A227]/10 text-[#B8860B] dark:text-[#E8C34A]"
                    : "border border-white/10 bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                }`}
              >
                <Crown className="h-3.5 w-3.5" />
                {isPro ? "PRO MEMBER" : "FREE PLAN"}
              </span>

              <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user.email || "No email"}</span>
              </p>
            </div>

            <div className="my-4 h-px bg-gray-200 dark:bg-white/10" />

            {/* Menu links */}
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const href =
                  typeof item.href === "function" ? item.href(user.role) : item.href

                return (
                  <Link
                    key={item.label}
                    href={href}
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#252B2D] transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0 text-[#76B900] dark:text-[#B6F70B]" />
                    <span className="flex-1">{item.label}</span>

                  

                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                  </Link>
                )
              })}
            </div>

            <div className="my-4 h-px bg-gray-200 dark:bg-white/10" />

            {/* Sign out */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              role="menuitem"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FDECEC] px-3 py-3 text-[13px] font-bold text-[#E11D48] transition-colors hover:bg-[#FBDCDC] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#E11D48]/10 dark:text-[#FB7185] dark:hover:bg-[#E11D48]/20"
            >
              <LogOut className="h-[18px] w-[18px]" />
              {signingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
