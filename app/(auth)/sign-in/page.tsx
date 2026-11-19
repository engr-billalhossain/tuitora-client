"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { signIn } from "@/lib/auth-client"

import {
  GraduationCap,
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Monitor,
  Star,
  ChartNoAxesColumnIncreasing,
  Check,
  Loader2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

type UserRole = "student" | "tutor"

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Tutors",
  },
  {
    icon: Monitor,
    title: "Online & Offline Classes",
  },
  {
    icon: Star,
    title: "Flexible & Affordable",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "Learn at Your Pace",
  },
]

export default function SignInPage() {
  const router = useRouter()

  const [role, setRole] = useState<UserRole>("student")
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    

    if (isLoading) return

    const formData = new FormData(e.currentTarget)
    const email = String(formData.get("email") || "").trim()

    setIsLoading(true)

    try {
      const { error } = await signIn.email({
        email,
        password,
        callbackURL: "/",
      })

      if (error) {
        toast.error(error.message || "Invalid email or password")

        return
      }

      toast.success("Signed in successfully!")

      router.push("/")
    } catch {
      toast.error("Sign in failed. Try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (socialLoading) return

    setSocialLoading(true)

    try {
      const { error } = await signIn.social({
        provider: "google",
        callbackURL: "/",
      })

      if (error) {
        toast.error(error.message || "Google sign-in failed")
      }
    } catch {
      toast.error("Google sign-in failed. Try again.")
    } finally {
      setSocialLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F3F7F1] p-2 transition-colors duration-300 sm:p-4 dark:bg-[#050B0E]">
      <Toaster />

      <div className="mx-auto grid min-h-[calc(100vh-16px)] max-w-[1500px] overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-xl lg:grid-cols-2 dark:border-white/5 dark:bg-[#080D0F]">
        {/* =====================================
            LEFT BRANDING SECTION
        ===================================== */}

        <section className="relative flex min-h-[720px] flex-col overflow-hidden bg-[#F5FAF2] px-7 py-7 sm:px-11 sm:py-9 dark:bg-[#080D0F]">
          {/* Background Decoration */}

          <div className="absolute -right-20 bottom-10 h-[400px] w-[400px] rounded-full bg-[#B6F70B]/15 blur-[100px] dark:bg-[#B6F70B]/10" />

          {/* Hero Content */}

          <div className="relative z-10 mt-10 max-w-[390px]">
            <h1 className="text-3xl leading-[1.2] font-extrabold tracking-tight text-[#101418] sm:text-[38px] dark:text-white">
              Find the Right Tutor for Your{" "}
              <span className="text-[#76B900] dark:text-[#B6F70B]">
                Learning Goals
              </span>
            </h1>

            <p className="mt-4 max-w-[310px] text-sm leading-6 text-gray-700 dark:text-gray-300">
              Connect with verified tutors, learn smarter and achieve more.
            </p>

            {/* Features */}

            <div className="mt-7 space-y-4">
              {features.map((feature) => {
                const Icon = feature.icon

                return (
                  <div key={feature.title} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#B6F70B]/15 text-[#76B900] dark:text-[#B6F70B]">
                      <Icon className="h-[17px] w-[17px]" />
                    </div>

                    <span className="text-sm font-semibold text-[#252B2D] dark:text-gray-200">
                      {feature.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Student Image */}

          <div className="pointer-events-none absolute right-0 bottom-0 z-0 h-[390px] w-[65%] max-w-[440px] sm:h-[470px]">
            <div className="absolute right-5 bottom-0 h-[260px] w-[260px] rounded-full bg-[#B6F70B]/30 sm:h-[310px] dark:bg-[#B6F70B]/15" />

            <div className="absolute right-0 bottom-0 h-[300px] w-[95%] rounded-tl-[180px] bg-gradient-to-tr from-[#B6F70B]/30 to-transparent dark:from-[#B6F70B]/20" />
          </div>
        </section>

        {/* =====================================
            RIGHT LOGIN SECTION
        ===================================== */}

        <section className="flex min-h-[720px] items-center justify-center bg-white p-4 transition-colors duration-300 sm:p-7 lg:p-10 dark:bg-[#11191F]">
          <Card className="w-full max-w-[450px] gap-0 border-none bg-transparent py-0 shadow-none ring-0 outline-none">
            {/* Login Heading */}

            <CardHeader className="px-0 pt-0 pb-7">
              <CardTitle className="text-2xl font-extrabold tracking-tight text-[#101418] sm:text-[29px] dark:text-white">
                Welcome Back! 👋
              </CardTitle>

              <CardDescription className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Sign in to your Tuitora account
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0 pb-0">
              {/* Student / Tutor Selection */}

              <div className="mb-6 grid grid-cols-2 gap-3">
                {/* Student */}

                <Button
                  type="button"
                  variant="outline"
                  aria-pressed={role === "student"}
                  onClick={() => setRole("student")}
                  className={`relative h-[88px] flex-col gap-1 rounded-2xl border-2 px-2 py-3 transition-all ${
                    role === "student"
                      ? "border-[#B6F70B] bg-[#B6F70B]/10 text-[#101418] hover:bg-[#B6F70B]/15 dark:bg-[#B6F70B]/10 dark:text-white"
                      : "border-gray-200 bg-white text-[#101418] hover:border-gray-300 dark:border-[#29343B] dark:bg-[#1A252C] dark:text-white dark:hover:border-gray-500"
                  }`}
                >
                  {role === "student" && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#B6F70B] text-black">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}

                  <GraduationCap
                    className={`h-7 w-7 ${
                      role === "student"
                        ? "text-[#76B900] dark:text-[#B6F70B]"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  />

                  <span className="text-sm font-bold">I am a Student</span>

                  <span className="text-center text-[11px] leading-tight font-normal text-gray-600 dark:text-gray-400">
                    Find tutors, join classes and learn
                  </span>
                </Button>

                {/* Tutor */}

                <Button
                  type="button"
                  variant="outline"
                  aria-pressed={role === "tutor"}
                  onClick={() => setRole("tutor")}
                  className={`relative h-[88px] flex-col gap-1 rounded-2xl border-2 px-2 py-3 transition-all ${
                    role === "tutor"
                      ? "border-[#B6F70B] bg-[#B6F70B]/10 text-[#101418] hover:bg-[#B6F70B]/15 dark:bg-[#B6F70B]/10 dark:text-white"
                      : "border-gray-200 bg-white text-[#101418] hover:border-gray-300 dark:border-[#29343B] dark:bg-[#1A252C] dark:text-white dark:hover:border-gray-500"
                  }`}
                >
                  {role === "tutor" && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#B6F70B] text-black">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}

                  <UserRound
                    className={`h-7 w-7 ${
                      role === "tutor"
                        ? "text-[#76B900] dark:text-[#B6F70B]"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  />

                  <span className="text-sm font-bold">I am a Tutor</span>

                  <span className="text-center text-[11px] leading-tight font-normal text-gray-600 dark:text-gray-400">
                    Create tuitions, teach and earn
                  </span>
                </Button>
              </div>

              {/* Login Form */}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}

                <div className="relative">
                  <Mail className="absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-400" />

                  <Input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    aria-label="Email address"
                    autoComplete="email"
                    required
                    className="h-[50px] rounded-xl border-gray-200 bg-white pl-12 text-sm text-[#101418] placeholder:text-gray-500 focus-visible:border-[#B6F70B] focus-visible:ring-[#B6F70B]/20 dark:border-[#303B42] dark:bg-[#141D23] dark:text-white dark:placeholder:text-gray-400"
                  />
                </div>

                {/* Password Input */}

                <div className="relative">
                  <LockKeyhole className="absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-400" />

                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    aria-label="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-[50px] rounded-xl border-gray-200 bg-white pr-12 pl-12 text-sm text-[#101418] placeholder:text-gray-500 focus-visible:border-[#B6F70B] focus-visible:ring-[#B6F70B]/20 dark:border-[#303B42] dark:bg-[#141D23] dark:text-white dark:placeholder:text-gray-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute top-1/2 right-2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md bg-transparent text-gray-500 transition-colors outline-none hover:bg-transparent hover:text-[#B6F70B] focus:outline-none active:scale-100 dark:text-gray-400"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 shrink-0" />
                    ) : (
                      <Eye className="h-5 w-5 shrink-0" />
                    )}
                  </button>
                </div>

                {/* Remember Me & Forgot Password */}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      className="border-gray-400 data-[state=checked]:border-[#B6F70B] data-[state=checked]:bg-[#B6F70B] data-[state=checked]:text-black dark:border-gray-500"
                    />

                    <Label
                      htmlFor="remember"
                      className="cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Remember me
                    </Label>
                  </div>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#76B900] hover:underline dark:text-[#B6F70B]"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-[50px] w-full gap-3 rounded-xl bg-[#B6F70B] text-sm font-bold text-[#11170A] shadow-sm hover:bg-[#C9FF42] hover:shadow-[0_5px_20px_rgba(182,247,11,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200 dark:bg-[#303B42]" />

                <span className="text-xs text-gray-500 dark:text-gray-400">
                  or continue with
                </span>

                <div className="h-px flex-1 bg-gray-200 dark:bg-[#303B42]" />
              </div>

              {/* Google Login */}

              <Button
                type="button"
                variant="outline"
                disabled={socialLoading}
                onClick={handleGoogleLogin}
                className="h-[46px] w-full gap-3 rounded-xl border-gray-200 bg-white text-sm font-semibold text-[#101418] hover:bg-gray-50 disabled:opacity-70 dark:border-[#303B42] dark:bg-[#1A252C] dark:text-white dark:hover:bg-[#223039]"
              >
                {socialLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.75 3.27-8.1Z"
                    />

                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z"
                    />

                    <path
                      fill="#FBBC05"
                      d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.11V7.05H2.15A11 11 0 0 0 1 12c0 1.78.43 3.46 1.15 4.95l3.69-2.84Z"
                    />

                    <path
                      fill="#EA4335"
                      d="M12 5.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.85 6.05l3.69 2.84C6.71 7.29 9.14 5.36 12 5.36Z"
                    />
                  </svg>
                )}
                {socialLoading ? "Connecting..." : "Continue with Google"}
              </Button>

              {/* Sign Up */}

              <p className="mt-6 text-center text-sm text-gray-700 dark:text-gray-300">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="font-bold text-[#76B900] hover:underline dark:text-[#B6F70B]"
                >
                  Sign Up
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
