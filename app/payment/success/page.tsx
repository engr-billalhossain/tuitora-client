"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Crown, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/lib/auth-client";

function SuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch } = useSession();
  const paymentIntentId = searchParams.get("payment_intent") ?? "";
  const sessionId = searchParams.get("session_id") ?? "";

  const [status, setStatus] = React.useState<"checking" | "done" | "error">(
    "checking"
  );
  const [message, setMessage] = React.useState("");
  // Guard against duplicate popups (StrictMode double-invokes effects in dev).
  const notified = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;

    async function confirm() {
      if (!paymentIntentId && !sessionId) {
        if (!notified.current) {
          notified.current = true;
          toast.error("Payment confirmation failed", {
            description: "No payment reference was provided.",
          });
        }
        setStatus("error");
        setMessage("No payment reference was provided.");
        return;
      }
      try {
        const response = await fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId, sessionId }),
        });
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          throw new Error(data.error || "Payment verification failed");
        }
        // Pull the fresh session so the PRO badge appears everywhere.
        await refetch();
        if (!cancelled) {
          if (!notified.current) {
            notified.current = true;
            toast.success("Payment successful — you're PRO now!", {
              description: "All PRO features are unlocked on your account.",
            });
          }
          setStatus("done");
        }
        router.refresh();
      } catch (err) {
        if (!cancelled) {
          const text =
            err instanceof Error ? err.message : "Verification failed";
          if (!notified.current) {
            notified.current = true;
            toast.error("Could not confirm your payment", {
              description: text,
            });
          }
          setStatus("error");
          setMessage(text);
        }
      }
    }

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [paymentIntentId, sessionId, refetch, router]);

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#050B0E] px-5 text-white">
      <div className="w-full max-w-md rounded-2xl border border-[#1E2A2E] bg-[#0B1215] p-8 text-center">
        {status === "checking" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#B6F70B]" />
            <h1 className="mt-5 text-xl font-extrabold">Confirming payment...</h1>
            <p className="mt-2 text-[13px] text-gray-400">
              Verifying your payment with Stripe. Please wait a moment.
            </p>
          </>
        )}

        {status === "done" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#B6F70B]/15">
              <CheckCircle2 className="h-7 w-7 text-[#B6F70B]" />
            </div>
            <Crown className="mx-auto mt-3 h-7 w-7 text-[#E8C34A]" />
            <h1 className="mt-3 text-2xl font-extrabold">You are PRO now!</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-400">
              Payment confirmed. Your account is upgraded and all PRO features
              are unlocked.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#B6F70B] px-5 py-3 text-sm font-extrabold text-black hover:bg-[#C9FF42]"
            >
              Go to dashboard
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-[#FB7185]" />
            <h1 className="mt-5 text-xl font-extrabold">Could not confirm</h1>
            <p className="mt-2 text-[13px] text-gray-400">{message}</p>
            <p className="mt-3 text-[12px] text-gray-500">
              If you completed the payment, refresh this page in a moment — the
              confirmation webhook may still be arriving.
            </p>
            <Link
              href="/pricing"
              className="mt-6 inline-flex rounded-lg border border-white/20 px-5 py-2.5 text-sm font-bold text-white hover:border-[#B6F70B] hover:text-[#B6F70B]"
            >
              Back to pricing
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <React.Suspense
      fallback={
        <main className="flex min-h-[75vh] items-center justify-center bg-[#050B0E]">
          <Loader2 className="h-6 w-6 animate-spin text-[#B6F70B]" />
        </main>
      }
    >
      <SuccessInner />
    </React.Suspense>
  );
}
