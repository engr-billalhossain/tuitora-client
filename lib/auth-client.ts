import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "@/lib/auth"

/**
 * Always talk to the origin that is actually serving the app.
 *
 * The previous hard-coded `http://localhost:3000` broke every OAuth flow
 * outside local development: on a deployed URL (or even 127.0.0.1 / a LAN IP)
 * the browser started Google sign-in against localhost, so the session cookie
 * landed on a different origin than the one the user was on and the callback
 * never completed. `NEXT_PUBLIC_BETTER_AUTH_URL` can override it when the app
 * is served behind a different public origin.
 */
const baseURL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  (typeof window !== "undefined" ? window.location.origin : undefined)

export const authClient = createAuthClient({
  ...(baseURL ? { baseURL } : {}),
  plugins: [inferAdditionalFields<typeof auth>()],
})

export const { signIn, signUp, useSession } = authClient
