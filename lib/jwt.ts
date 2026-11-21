import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal, dependency-free JWT (HS256) helper.
 *
 * BetterAuth owns the actual session (HTTP-only cookie). This token is a short
 * lived, signed representation of that session that the browser stores in
 * memory and sends as `Authorization: Bearer <token>` on protected requests.
 * The secret is never shipped to the client.
 */

const SECRET =
  process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || "mentorlagbe-dev-jwt-secret";

const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

type Claims = {
  sub: string;
  role: string;
  email?: string;
  iat: number;
  exp: number;
};

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createSessionToken(user: {
  id: string;
  role?: string | null;
  email?: string | null;
}): { token: string; expiresAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const claims: Claims = {
    sub: user.id,
    role: user.role || "student",
    email: user.email || undefined,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify(claims));
  const signature = sign(`${header}.${payload}`);
  return {
    token: `${header}.${payload}.${signature}`,
    expiresAt: claims.exp * 1000,
  };
}

/** Verifies the signature and expiry. Returns null for any invalid token. */
export function verifySessionToken(token: string): Claims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = sign(`${header}.${payload}`);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Claims;
    if (!claims.sub || typeof claims.exp !== "number") return null;
    if (claims.exp * 1000 <= Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

/** Reads and verifies a Bearer token from a Request, if one was supplied. */
export function getTokenClaims(request: Request): Claims | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return verifySessionToken(authorization.slice(7).trim());
}
