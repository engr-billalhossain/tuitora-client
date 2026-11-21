/* ==========================================================================
   Shared, dependency-free validation helpers.

   These functions are used by both client and server code. They never trust
   browser input: every value is coerced, stripped of control characters and
   length-limited before it reaches a database write.
   ========================================================================== */

/** Removes control characters, collapses whitespace and caps the length. */
export function cleanText(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Phone numbers: digits, spaces, + and - only. */
export function cleanPhone(value: unknown): string {
  return cleanText(value, 30).replace(/[^\d\s+-]/g, "").trim();
}

export type ApplicationStatus = "pending" | "accepted" | "rejected";

/**
 * Old records used "enrolled"/"declined". New records use the canonical
 * pending/accepted/rejected values. Reading must understand both.
 */
export function normalizeApplicationStatus(value: unknown): ApplicationStatus {
  const status = cleanText(value, 20).toLowerCase();
  if (status === "enrolled" || status === "accepted") return "accepted";
  if (status === "declined" || status === "rejected") return "rejected";
  return "pending";
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export function normalizeApprovalStatus(value: unknown): ApprovalStatus {
  const status = cleanText(value, 20).toLowerCase();
  if (status === "approved" || status === "published") return "approved";
  if (status === "declined" || status === "rejected") return "rejected";
  return "pending";
}

/** Tuition mode is always stored as Online / Offline. */
export function normalizeMode(value: unknown): "Online" | "Offline" {
  return cleanText(value, 20).toLowerCase() === "offline" ? "Offline" : "Online";
}

/** Positive integer-ish money string, e.g. "1500" or "1500.50". */
export function isPositiveAmount(value: unknown): boolean {
  const text = cleanText(value, 20);
  return /^\d+(\.\d{1,2})?$/.test(text) && Number(text) > 0;
}
