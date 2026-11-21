"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"

import { useSession } from "@/lib/auth-client"
import { UserMenu } from "@/components/user-menu"

type NavLink = {
  name: string
  href: string
  disabled?: boolean
}

const publicNavLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Browse Tuitions", href: "/tuitions" },
  { name: "Pricing / Pro Plans", href: "/pricing" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About", href: "/about" },
]

// Admins only see these three links in the top navbar.
const adminNavLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Browse Tuitions", href: "#", disabled: true },
  { name: "Dashboard", href: "/dashboard/admin" },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: session, isPending } = useSession()
  // One theme source for the whole app (landing pages + dashboard). The
  // previous local classList toggle could desync from next-themes / the `d`
  // hotkey, so it is replaced with setTheme.
  const { resolvedTheme, setTheme } = useTheme()
  // True only after hydration, without an effect-driven state update.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const isDark = mounted ? resolvedTheme === "dark" : true

  const loggedInUser = session?.user
  const isAdmin = loggedInUser?.role === "admin"
  const navLinks = isAdmin ? adminNavLinks : publicNavLinks

  const toggleTheme = () => setTheme(isDark ? "light" : "dark")

  const headerStyle = isDark
    ? "bg-[#080D0F] text-white border-white/10"
    : "bg-white text-[#101418] border-[#E9ECE8]"

  const navText = isDark
    ? "text-gray-300 hover:text-[#B6F70B]"
    : "text-[#424B50] hover:text-[#78B900]"

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b shadow-sm transition-colors duration-300 ${headerStyle}`}
    >
      <nav className="mx-auto flex h-[66px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        {/* LOGO */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="MentorLagbe Home"
        >
          <svg
            viewBox="0 0 48 40"
            className="h-9 w-9 text-[#B6F70B]"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M24 3L2 13L24 23L42 15V26H46V13L24 3Z" />
            <path d="M11 19V29C18 36 30 36 37 29V19L24 25L11 19Z" />
            <path d="M4 15V26H8V17L4 15Z" />
          </svg>

          <span
            className={`text-[23px] font-extrabold tracking-tight ${
              isDark ? "text-white" : "text-[#101418]"
            }`}
          >
            MentorLagbe
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link, index) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={link.disabled ? (event) => event.preventDefault() : undefined}
              className={`relative py-6 text-[13px] font-semibold transition-colors duration-200 ${
                link.disabled
                  ? "cursor-not-allowed opacity-60"
                  : index === 0
                    ? "text-[#B6F70B]"
                    : navText
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3">
          {/* THEME TOGGLE */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle light and dark mode"
            className={`flex h-9 items-center gap-1 rounded-full border p-1 transition-all duration-300 ${
              isDark
                ? "border-white/15 bg-[#11191C]"
                : "border-gray-200 bg-gray-100"
            }`}
          >
            {/* SUN */}
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                !isDark ? "bg-[#B6F70B] text-black" : "text-gray-400"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" />
              </svg>
            </span>

            {/* MOON */}
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                isDark ? "bg-[#B6F70B] text-black" : "text-gray-400"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
              </svg>
            </span>
          </button>

          {/* AUTH AREA */}
          {!isPending &&
            (loggedInUser ? (
              <UserMenu user={loggedInUser} />
            ) : (
              <>
                {/* SIGN IN */}
                <Link
                  href="/sign-in"
                  className="hidden rounded-full border border-[#B6F70B] px-5 py-2 text-[13px] font-semibold transition-all duration-200 hover:bg-[#B6F70B] hover:text-black sm:inline-flex"
                >
                  Sign In
                </Link>

                {/* SIGN UP */}
                <Link
                  href="/sign-up"
                  className="hidden rounded-full bg-[#B6F70B] px-5 py-2 text-[13px] font-bold text-black transition-all duration-200 hover:bg-[#C9FF42] hover:shadow-[0_0_18px_rgba(182,247,11,0.3)] sm:inline-flex"
                >
                  Sign Up
                </Link>
              </>
            ))}

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors lg:hidden ${
              isDark
                ? "border-white/15 text-white"
                : "border-gray-200 text-gray-800"
            }`}
          >
            {menuOpen ? (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 6H20M4 12H20M4 18H20" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* MOBILE NAVIGATION */}
      {menuOpen && (
        <div
          className={`border-t px-5 py-5 lg:hidden ${
            isDark ? "border-white/10 bg-[#080D0F]" : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((link, index) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={
                  link.disabled
                    ? (event) => event.preventDefault()
                    : () => setMenuOpen(false)
                }
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                  link.disabled
                    ? "cursor-not-allowed opacity-60"
                    : index === 0
                      ? "bg-[#B6F70B]/10 text-[#78B900]"
                      : navText
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* MOBILE AUTH AREA */}
          {!isPending &&
            (loggedInUser ? (
              <div className="mt-4 sm:hidden">
                <UserMenu user={loggedInUser} />
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:hidden">
                <Link
                  href="/sign-in"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full border border-[#B6F70B] py-3 text-center text-sm font-semibold"
                >
                  Sign In
                </Link>

                <Link
                  href="/sign-up"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full bg-[#B6F70B] py-3 text-center text-sm font-bold text-black"
                >
                  Sign Up
                </Link>
              </div>
            ))}
        </div>
      )}
    </header>
  )
}
