import Link from "next/link"
import { ArrowLeft, RotateCcw, TriangleAlert } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

/**
 * BetterAuth redirects failed OAuth flows to `${baseURL}/error?error=...`.
 * This route used to be missing (404), which made every Google sign-in failure
 * look like a broken app instead of showing the actual reason.
 */
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  access_denied: {
    title: "Sign-in was cancelled",
    description:
      "You dismissed the Google consent screen. Nothing was changed — you can try again whenever you like.",
  },
  redirect_uri_mismatch: {
    title: "Google redirect URL is not allowed",
    description:
      "This site's Google OAuth client does not allow the callback URL below. Add it to Authorized redirect URIs in Google Cloud Console → APIs & Services → Credentials → your OAuth client, then save (it can take a few minutes to propagate).",
  },
  invalid_client: {
    title: "Google OAuth credentials are invalid",
    description:
      "The GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET configured on the server were rejected. Check the values in your environment variables.",
  },
  state_not_found: {
    title: "Sign-in session expired",
    description:
      "The sign-in request timed out or was started in another tab. Please start the sign-in again.",
  },
  state_mismatch: {
    title: "Sign-in session expired",
    description:
      "The sign-in request could not be verified. Please start the sign-in again.",
  },
  state_invalid: {
    title: "Sign-in session expired",
    description:
      "The sign-in request could not be verified. Please start the sign-in again.",
  },
  state_security_mismatch: {
    title: "Sign-in session expired",
    description:
      "The sign-in request could not be verified. Please start the sign-in again.",
  },
  no_code: {
    title: "Google did not return a code",
    description:
      "The sign-in callback was incomplete. Please try again from the sign-in page.",
  },
  provider_not_found: {
    title: "Provider unavailable",
    description:
      "The Google provider is not configured on the server. Check the server environment variables.",
  },
  email_not_found: {
    title: "No email from Google",
    description:
      "Your Google account did not share an email address. Allow the email scope and try again.",
  },
  oauth_link_error: {
    title: "Could not link this account",
    description:
      "An account with this email already exists with a different sign-in method. Sign in with your original method, or contact support.",
  },
  unable_to_create_user: {
    title: "Could not create your account",
    description:
      "We could not save the new account. Please try again, or contact support if it keeps happening.",
  },
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; error_description?: string | string[] }>
}) {
  const params = await searchParams
  const code = Array.isArray(params.error) ? params.error[0] : params.error
  const description = Array.isArray(params.error_description)
    ? params.error_description[0]
    : params.error_description

  const known = code ? ERROR_MESSAGES[code] : undefined
  const title = known?.title ?? "Sign-in could not be completed"
  const detail =
    known?.description ??
    description ??
    "Something went wrong while connecting to Google. Please try again."

  return (
    <main className="min-h-screen bg-[#F3F7F1] p-4 transition-colors duration-300 sm:p-6 dark:bg-[#050B0E]">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-xl items-center justify-center">
        <div className="w-full rounded-[22px] border border-gray-200 bg-white p-8 shadow-xl sm:p-10 dark:border-white/5 dark:bg-[#080D0F]">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <TriangleAlert className="h-7 w-7" />
          </span>

          <h1 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-[#101418] dark:text-white">
            {title}
          </h1>
          <p className="mt-3 text-center text-sm leading-6 text-gray-600 dark:text-gray-400">
            {detail}
          </p>

          {code && !known && (
            <p className="mt-3 text-center font-mono text-xs text-gray-400 dark:text-gray-500">
              error: {code}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants(),
                "h-12 w-full gap-2 rounded-xl bg-[#B6F70B] text-sm font-bold text-[#11170A] hover:bg-[#C9FF42]"
              )}
            >
              <RotateCcw className="h-4 w-4" /> Back to sign in
            </Link>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 w-full gap-2 rounded-xl text-sm font-semibold"
              )}
            >
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
