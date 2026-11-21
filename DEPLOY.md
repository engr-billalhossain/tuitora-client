# Deploying the Tuitora frontend (Next.js) to Vercel

This is a standard Next.js App Router app. **No `vercel.json` is needed** — Vercel detects Next.js from `package.json` and uses `next build` / `next start` automatically.

## One-time Vercel setup

1. Push the repo to GitHub.
2. Vercel → **Add New → Project** → import the repo. Framework preset should show **Next.js**. Leave build command and output directory as the defaults.
3. **Settings → Environment Variables** — add each key separately, ticking **Production**, **Preview** and **Development** (see `.env.example` for the full list):

   ```
   BETTER_AUTH_URL=https://<your-frontend>.vercel.app
   MONGODB_URI=mongodb+srv://<user>:<password>@<real-cluster-host>/?retryWrites=true&w=majority
   BETTER_AUTH_SECRET=<same secret as backend>
   JWT_SECRET=<same secret as backend>
   BACKEND_API_URL=https://<your-backend>.vercel.app
   NEXT_PUBLIC_BASE_URL=https://<your-backend>.vercel.app
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   IMAGEBB_API_KEY=...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
   STRIPE_SECRET_KEY=...
   STRIPE_WEBHOOK_SECRET=...
   ```

   Important:
   - `BETTER_AUTH_URL` must be the **deployed frontend URL**, not localhost. Auth callbacks and Stripe redirects depend on it.
   - `JWT_SECRET` / `BETTER_AUTH_SECRET` must **exactly match** the backend, otherwise tokens minted here fail verification there.
   - Variables starting with `NEXT_PUBLIC_` are baked into the client bundle at **build time** — after changing them you **must redeploy**.

4. MongoDB Atlas → **Network Access** → allow `0.0.0.0/0` (same as the backend).
5. **Redeploy** after any env change.

### Optional: set the variables from the local `.env` automatically

Instead of adding them one by one in the dashboard, log in and link the repo once:

```bash
npx vercel login
npx vercel link --yes
```

Then push every key (localhost URLs are rewritten to the deployed URLs):

```bash
npm run setup:vercel -- https://<your-frontend>.vercel.app https://<your-backend>.vercel.app
```

Preview with `npm run setup:vercel -- https://<your-frontend>.vercel.app --dry-run` first if you want to see the keys (secrets stay masked). Redeploy afterwards so `NEXT_PUBLIC_*` values are baked into the client bundle.

## External services to update

- **Google Cloud Console → Credentials → OAuth client** — add these Authorized redirect URIs (under **APIs & Services → Credentials → your OAuth 2.0 Client ID → Authorized redirect URIs**):
  ```
  http://localhost:3000/api/auth/callback/google
  https://<your-frontend>.vercel.app/api/auth/callback/google
  ```
  Missing the localhost entry makes Google return `redirect_uri_mismatch` and Google sign-in never completes locally. The values must match `BETTER_AUTH_URL` exactly (no trailing slash).
- **Stripe Dashboard → Webhooks → Add endpoint**:
  ```
  https://<your-frontend>.vercel.app/api/stripe/webhook
  ```
  Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## How the two projects relate

The frontend is self-contained: its own `/api/*` route handlers talk to MongoDB directly. The Express backend is only an optional faster path for the browse listing (`lib/browse.ts` tries `BACKEND_API_URL/courses` first, with a 1.5 s timeout, then falls back to MongoDB). So the frontend works even if the backend is temporarily down — but set `BACKEND_API_URL` to your deployed backend for the best experience.

## Verify

1. Open `https://<your-frontend>.vercel.app` — the home page loads.
2. Sign up / sign in (email and Google).
3. Browse the tuition listing — check Vercel logs for any fetch errors.
4. `NEXT_PUBLIC_BASE_URL` and `BACKEND_API_URL` should point to the deployed backend, never `localhost`.
