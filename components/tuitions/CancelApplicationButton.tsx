"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";

import { useSession } from "@/lib/auth-client";
import { cancelBooking } from "@/lib/actions/postTuitions";
import {
  APPLICATIONS_CHANGED_EVENT,
  hasApplied,
  readApplications,
  removeApplication,
  type BrowseTuition,
} from "@/lib/tuitions";

export function CancelApplicationButton({
  tuition,
}: {
  tuition: BrowseTuition;
}) {
  const { data: session } = useSession();
  const [applied, setApplied] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setApplied(hasApplied(tuition.id));
    sync();
    window.addEventListener(APPLICATIONS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(APPLICATIONS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [tuition.id]);

  if (!applied) return null;

  const handleCancel = async () => {
    if (busy) return;
    if (!session?.user) {
      toast.error("Please log in to cancel your application.");
      return;
    }

    const application = readApplications().find(
      (item) => item.tuitionId === tuition.id
    );
    setBusy(true);
    try {
      if (application?.slotId) {
        // Remove the server-side booking first so the slot frees up for others.
        await cancelBooking(tuition.id, application.slotId);
      }
      removeApplication(tuition.id);
      setApplied(false);
      toast.success("Your application has been cancelled.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not cancel your application. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={busy}
      className="mt-2.5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/5 text-[12px] font-bold text-rose-300 transition-colors hover:border-rose-400/50 hover:bg-rose-500/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      {busy ? "Cancelling..." : "Cancel Application"}
    </button>
  );
}
