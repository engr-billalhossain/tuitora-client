"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/lib/auth-client";
import { isProPlanValue, PRO_PLANS, type ProPlan } from "@/lib/plans";
import { isProValue } from "@/lib/plans";

type PaymentSetup = {
  clientSecret: string;
  publishableKey: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  plan: ProPlan;
};

const appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#B6F70B",
    colorBackground: "#0B1215",
    colorText: "#F5F7F5",
    colorDanger: "#FB7185",
    fontFamily: "inherit",
    borderRadius: "10px",
  },
};

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();

  const requestedPlan = searchParams.get("plan");
  const plan: ProPlan = isProPlanValue(requestedPlan)
    ? requestedPlan
    : session?.user?.role === "tutor"
      ? "tutor"
      : "student";
  const price = PRO_PLANS[plan];

  const [setup, setSetup] = React.useState<PaymentSetup | null>(null);
  const [alreadyPro, setAlreadyPro] = React.useState(isProValue(session?.user?.plan));
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [paying, setPaying] = React.useState(false);
  const [hostedLoading, setHostedLoading] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const stripeRef = React.useRef<Stripe | null>(null);
  const elementsRef = React.useRef<StripeElements | null>(null);
  const userId = session?.user?.id;

  // Unauthenticated visitors cannot buy anything.
  React.useEffect(() => {
    if (isPending || userId) return;
    const callback = encodeURIComponent(`/checkout?plan=${plan}`);
    router.replace(`/sign-in?callbackURL=${callback}`);
  }, [isPending, userId, plan, router]);

  // Step 1: ask the server to create a PaymentIntent with a server-side price.
  React.useEffect(() => {
    if (isPending || !userId || alreadyPro) return;
    let cancelled = false;

    async function start() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/stripe/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          throw new Error(data.error || "Could not start checkout");
        }
        if (data.alreadyPro) {
          setAlreadyPro(true);
          return;
        }
        if (!data.publishableKey) {
          throw new Error("Stripe publishable key is not configured");
        }
        setSetup(data as PaymentSetup);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not start checkout");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void start();
    return () => {
      cancelled = true;
    };
  }, [isPending, userId, plan, alreadyPro]);

  // Step 2: mount the embedded Stripe Payment Element.
  React.useEffect(() => {
    if (!setup || !containerRef.current) return;
    const currentSetup = setup;
    let cancelled = false;

    async function mount() {
      try {
        const stripe = await loadStripe(currentSetup.publishableKey);
        if (!stripe || cancelled || !containerRef.current) {
          throw new Error("Could not load Stripe. Check your connection.");
        }
        const elements = stripe.elements({
          clientSecret: currentSetup.clientSecret,
          appearance,
        });
        const paymentElement = elements.create("payment");
        paymentElement.mount(containerRef.current);

        stripeRef.current = stripe;
        elementsRef.current = elements;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load payment form");
        }
      }
    }

    void mount();

    return () => {
      cancelled = true;
      elementsRef.current = null;
      stripeRef.current = null;
    };
  }, [setup]);

  async function handlePay(event: React.FormEvent) {
    event.preventDefault();
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements || !setup || paying) return;

    setPaying(true);
    setError("");
    try {
      const returnUrl = `${window.location.origin}/payment/success?payment_intent=${encodeURIComponent(
        setup.paymentIntentId
      )}`;
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });

      if (confirmError) {
        throw new Error(confirmError.message || "Payment was not completed");
      }
      if (paymentIntent) {
        if (paymentIntent.status === "succeeded") {
          router.push(returnUrl);
        } else {
          throw new Error(`Payment status: ${paymentIntent.status}`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      setError(message);
      toast.error(message);
    } finally {
      setPaying(false);
    }
  }

  async function startHostedCheckout() {
    if (hostedLoading) return;
    setHostedLoading(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        alreadyPro?: boolean;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Could not start checkout");
      if (data.alreadyPro) {
        setAlreadyPro(true);
        return;
      }
      if (!data.url) throw new Error("Stripe did not return a checkout URL");
      window.location.assign(data.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start checkout";
      setError(message);
      toast.error(message);
    } finally {
      setHostedLoading(false);
    }
  }

  if (isPending) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#050B0E] text-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#B6F70B]" />
      </main>
    );
  }

  if (alreadyPro) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#050B0E] px-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-[#B6F70B]/30 bg-[#0B1215] p-8 text-center">
          <Crown className="mx-auto h-10 w-10 text-[#E8C34A]" />
          <h1 className="mt-4 text-xl font-extrabold">You are already PRO</h1>
          <p className="mt-2 text-sm text-gray-400">
            Your account already has all PRO features unlocked.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-lg bg-[#B6F70B] px-5 py-2.5 text-sm font-bold text-black"
          >
            Go to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-[#050B0E] px-5 py-12 text-white">
      <div className="mx-auto max-w-[960px]">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-gray-400 hover:text-[#B6F70B]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to pricing
        </Link>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.3fr]">
          {/* Order summary */}
          <section className="rounded-2xl border border-[#1E2A2E] bg-[#0B1215] p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-3 py-1 text-[10px] font-bold text-[#E8C34A]">
              <Crown className="h-3 w-3" /> PRO PLAN
            </span>
            <h1 className="mt-4 text-2xl font-extrabold">{price.label}</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-400">
              One-time upgrade. PRO is activated on your account as soon as the
              payment is confirmed.
            </p>

            <div className="mt-6 flex items-end gap-1 border-t border-[#1E2A2E] pt-5">
              <span className="text-4xl font-extrabold text-[#B6F70B]">
                ${(price.amount / 100).toFixed(2)}
              </span>
              <span className="pb-1 text-[12px] text-gray-500">USD</span>
            </div>

            <ul className="mt-5 space-y-3 text-[13px] text-gray-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#B6F70B]" /> Unlimited plan features
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#B6F70B]" /> Verified PRO badge
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#B6F70B]" /> Active on your own account
              </li>
            </ul>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-[#1E2A2E] bg-[#0B1215] p-6">
            <h2 className="text-lg font-bold">Payment details</h2>
            <p className="mt-1 text-[12px] text-gray-500">
              Your card details are handled by Stripe and never touch this server.
            </p>

            {loading ? (
              <div className="mt-8 flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin text-[#B6F70B]" />
                Preparing secure checkout...
              </div>
            ) : error && !setup ? (
              <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-300">
                {error}
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-3 block font-bold underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <form onSubmit={handlePay} className="mt-6">
                <div ref={containerRef} className="min-h-[220px]" />

                {error && (
                  <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[12px] text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={paying || !setup}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#B6F70B] text-sm font-extrabold text-black transition-colors hover:bg-[#C9FF42] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="h-4 w-4" /> Pay ${(price.amount / 100).toFixed(2)}
                    </>
                  )}
                </button>

                <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#B6F70B]" />
                  Secured by Stripe ·Encrypted payment
                </p>
              </form>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0B1215] p-6 text-center">
          <h2 className="text-sm font-bold text-white">Prefer Stripe Checkout?</h2>
          <p className="mt-1 text-[12px] text-gray-500">
            Pay on Stripe&apos;s secure hosted page. The price is fixed by the server.
          </p>
          <button
            type="button"
            onClick={startHostedCheckout}
            disabled={hostedLoading}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl border border-[#B6F70B]/50 px-6 text-[13px] font-extrabold text-[#B6F70B] transition-colors hover:bg-[#B6F70B]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {hostedLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {hostedLoading ? "Redirecting..." : "Continue to Stripe Checkout"}
          </button>
        </section>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense
      fallback={
        <main className="flex min-h-[70vh] items-center justify-center bg-[#050B0E]">
          <Loader2 className="h-6 w-6 animate-spin text-[#B6F70B]" />
        </main>
      }
    >
      <CheckoutInner />
    </React.Suspense>
  );
}
