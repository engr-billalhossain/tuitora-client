import { betterAuth } from "better-auth";
import { getOAuthState } from "better-auth/api";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "@better-auth/mongo-adapter";

const client = new MongoClient(process.env.MONGODB_URI as string);
const db = client.db("tuitoradb");

/**
 * Reads the role the visitor picked on the sign-up / sign-in page.
 *
 * Email signup sends `role` in the request body, but Google (and every other
 * OAuth provider) only sends the provider profile, which has no role field.
 * The auth pages pass the selection through `signIn.social`'s `additionalData`,
 * which BetterAuth stores in the OAuth state and restores on the callback.
 * `getOAuthState()` is request-scoped, so it is only available while an auth
 * endpoint is running — hence the try/catch for non-OAuth flows.
 */
async function resolveSelectedRole(userRole: unknown): Promise<string> {
  let oauthRole: unknown;
  try {
    const state = await getOAuthState<{ role?: unknown }>();
    oauthRole = state?.role;
  } catch {
    // No OAuth request state (e.g. email signup) — fall back to the body field.
  }
  return String(oauthRole ?? userRole ?? "").toLowerCase();
}

/**
 * Fields the browser is never allowed to set through BetterAuth endpoints.
 * PRO activation and role changes go through verified server routes only.
 */
const SERVER_OWNED_FIELDS = [
  "role",
  "plan",
  "proPlan",
  "proActivatedAt",
  "stripeCustomerId",
  "stripePaymentIntentId",
] as const;

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

if (!googleClientId || !googleClientSecret) {
  // Warn instead of throwing so `next build` still succeeds before all env
  // vars are configured (e.g. the first Vercel deploy). Google sign-in simply
  // cannot complete until they are set.
  console.warn(
    "[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are missing. Google sign-in will not work until they are configured (see .env.example)."
  )
}

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      // A user may sign up as a student or a tutor. "admin" is intentionally
      // NOT accepted here — it can only be granted via /api/admin/users.
      role: {
        type: "string",
        defaultValue: "student",
        required: false,
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      bio: {
        type: "string",
        required: false,
        input: true,
      },
      // Billing state is server-owned. `input: false` keeps these fields out
      // of sign-up / update-user payloads so the browser cannot grant itself PRO.
      plan: {
        type: "string",
        defaultValue: "free",
        required: false,
        input: false,
      },
      proPlan: {
        type: "string",
        required: false,
        input: false,
      },
      proActivatedAt: {
        type: "string",
        required: false,
        input: false,
      },
      stripeCustomerId: {
        type: "string",
        required: false,
        input: false,
      },
      stripePaymentIntentId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  /**
   * Defense in depth: even if a future endpoint forgets `input: false`, the
   * database hook strips privileged fields and sanitises the role.
   */
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const role = await resolveSelectedRole(user.role);
          return {
            data: {
              ...user,
              role: role === "tutor" || role === "teacher" ? "tutor" : "student",
              plan: "free",
            },
          };
        },
      },
      update: {
        before: async (user) => {
          const safe: Record<string, unknown> = { ...user };
          for (const field of SERVER_OWNED_FIELDS) delete safe[field];
          return { data: safe as Record<string, never> };
        },
      },
    },
  },
  baseURL: process.env.BETTER_AUTH_URL,
  socialProviders: {
    google: {
      clientId: googleClientId as string,
      clientSecret: googleClientSecret as string,
    },
  },

  database: mongodbAdapter(db, {
    client,
  }),
});
