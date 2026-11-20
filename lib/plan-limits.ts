/* ==========================================================================
   Free-plan usage limits.

   These are enforced on the server (API routes) so they cannot be bypassed
   from the browser. The client also reacts to the shared error code by
   redirecting the user to the pricing page to upgrade.
   ========================================================================== */

export const FREE_TUITION_POST_LIMIT = 2;
export const FREE_APPLICATION_LIMIT = 5;

export const PLAN_LIMIT_REACHED = "PLAN_LIMIT_REACHED";

export class PlanLimitError extends Error {
  readonly code = PLAN_LIMIT_REACHED;

  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export function isPlanLimitError(error: unknown): error is PlanLimitError {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: string }).code === PLAN_LIMIT_REACHED
  );
}
