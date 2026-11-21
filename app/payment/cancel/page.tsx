"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function PaymentCancelPage() {
  const notified = React.useRef(false);

  React.useEffect(() => {
    if (notified.current) return;
    notified.current = true;
    toast.info("Payment cancelled", {
      description: "No charge was made. You can try again whenever you're ready.",
    });
  }, []);

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#050B0E] px-5 text-white">
      <div className="w-full max-w-md rounded-2xl border border-[#1E2A2E] bg-[#0B1215] p-8 text-center">
        <XCircle className="mx-auto h-11 w-11 text-amber-400" />
        <h1 className="mt-5 text-xl font-extrabold">Payment cancelled</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-400">
          No charge was made. Your account is still on the Free plan — you can
          try again whenever you are ready.
        </p>
        <Link
          href="/pricing"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#B6F70B] px-5 py-3 text-sm font-extrabold text-black hover:bg-[#C9FF42]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to pricing
        </Link>
      </div>
    </main>
  );
}
