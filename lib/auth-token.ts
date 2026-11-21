"use client";

/**
 * Client-side JWT cache + fetch wrapper.
 *
 * The token is issued by /api/auth/token from the BetterAuth session and is
 * attached as `Authorization: Bearer <token>` to protected API calls. It lives
 * in memory (and sessionStorage for a page refresh) and is never persisted in
 * localStorage.
 */

const STORAGE_KEY = "mentorlagbe:session-token";
const EXPIRY_KEY = "mentorlagbe:session-token-expiry";

let memoryToken: string | null = null;
let memoryExpiry = 0;
let pending: Promise<string | null> | null = null;

function readCachedToken(): string | null {
  if (memoryToken && memoryExpiry - 30_000 > Date.now()) return memoryToken;
  if (typeof window === "undefined") return null;
  try {
    const token = window.sessionStorage.getItem(STORAGE_KEY);
    const expiry = Number(window.sessionStorage.getItem(EXPIRY_KEY) || 0);
    if (token && expiry - 30_000 > Date.now()) {
      memoryToken = token;
      memoryExpiry = expiry;
      return token;
    }
  } catch {
    /* storage unavailable */
  }
  return null;
}

function storeToken(token: string, expiresAt: number) {
  memoryToken = token;
  memoryExpiry = expiresAt;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, token);
    window.sessionStorage.setItem(EXPIRY_KEY, String(expiresAt));
  } catch {
    /* storage unavailable — in-memory cache still works */
  }
}

export function clearAuthToken() {
  memoryToken = null;
  memoryExpiry = 0;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(EXPIRY_KEY);
  } catch {
    /* ignore */
  }
}

/** Fetches a fresh JWT after login, or returns the cached one when valid. */
export async function refreshAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch("/api/auth/token", { cache: "no-store" });
    if (!response.ok) {
      clearAuthToken();
      return null;
    }
    const data = (await response.json()) as { token?: string; expiresAt?: number };
    if (!data.token || !data.expiresAt) return null;
    storeToken(data.token, data.expiresAt);
    return data.token;
  } catch {
    return null;
  }
}

/** Returns a valid token, requesting a new one only when necessary. */
export async function getAuthToken(): Promise<string | null> {
  const cached = readCachedToken();
  if (cached) return cached;
  if (pending) return pending;
  pending = refreshAuthToken().finally(() => {
    pending = null;
  });
  return pending;
}

/**
 * Drop-in replacement for fetch that adds the Bearer token when available.
 * Works for both public and protected endpoints: if no session exists the
 * request simply goes out without an Authorization header.
 */
export async function authFetch(
  input: string | URL | Request,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  if (!token) return fetch(input, init);

  const headers = new Headers(init.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
