#!/usr/bin/env node
/**
 * Push the keys from the local .env file into a Vercel project.
 *
 * One-time prerequisites (interactive, cannot be automated):
 *   npx vercel login
 *   npx vercel link --yes        # run from this repo root
 *
 * Then:
 *   npm run setup:vercel -- https://<your-frontend>.vercel.app [https://<your-backend>.vercel.app]
 *   npm run setup:vercel -- https://<your-frontend>.vercel.app --dry-run   # preview only
 *
 * Production URLs are rewritten from the localhost values in .env. Nothing is
 * printed in clear text; secrets are masked in dry-run output.
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const positional = args.filter((arg) => !arg.startsWith("--"));
const [frontendUrlRaw, backendUrlRaw] = positional;

if (!frontendUrlRaw) {
  console.error(
    "Usage: node scripts/setup-vercel-env.mjs <https://your-frontend.vercel.app> " +
      "[https://your-backend.vercel.app] [--dry-run]"
  );
  process.exit(1);
}

function parseEnv(text) {
  const result = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    // Drop trailing inline comments such as `... # Base URL of your app`.
    const comment = value.search(/\s+#/);
    if (comment !== -1) value = value.slice(0, comment).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function mask(value) {
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

const envPath = resolve(process.cwd(), ".env");
if (!existsSync(envPath)) {
  console.error(`No .env file found at ${envPath}`);
  process.exit(1);
}

const values = parseEnv(readFileSync(envPath, "utf8"));
const frontendUrl = frontendUrlRaw.replace(/\/$/, "");
const backendUrl = (backendUrlRaw ?? frontendUrlRaw).replace(/\/$/, "");

values.BETTER_AUTH_URL = frontendUrl;
values.NEXT_PUBLIC_BASE_URL = backendUrl;
values.BACKEND_API_URL = backendUrl;
if ("BASE_URL" in values) values.BASE_URL = frontendUrl;
if (!values.JWT_SECRET) values.JWT_SECRET = values.BETTER_AUTH_SECRET;

const targets = ["production", "preview", "development"];

for (const [key, value] of Object.entries(values)) {
  if (!key || !value) continue;

  for (const target of targets) {
    if (dryRun) {
      console.log(`[dry-run] ${key} -> ${target} (${mask(value)})`);
      continue;
    }

    const result = spawnSync("npx", ["--yes", "vercel@latest", "env", "add", key, target], {
      input: value,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (result.status !== 0) {
      console.error(
        `Failed to add ${key} (${target}):\n${result.stderr?.trim() || result.stdout?.trim()}`
      );
      process.exitCode = 1;
    } else {
      console.log(`Added ${key} -> ${target}`);
    }
  }
}

if (!dryRun) {
  console.log("\nDone. Redeploy from the Vercel dashboard so NEXT_PUBLIC_* values are baked in.");
}
