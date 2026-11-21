"use client";

import * as React from "react";
import { AlertCircle, CreditCard, RefreshCw } from "lucide-react";

/* Data comes from GET /api/admin/payments — admin-only transaction ledger. */

type Payment = {
  id: string;
  userEmail: string;
  userName: string;
  userRole: string;
  planName: string;
  amount: number;
  currency: string;
  transactionId: string;
  stripeSessionId: string;
  paymentStatus: "paid";
  paidAt: string;
};

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(() => {
    fetch("/api/admin/payments", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          payments?: Payment[];
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error || "Could not load payments");
        setPayments(Array.isArray(payload.payments) ? payload.payments : []);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load payments");
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  function handleRefresh() {
    setLoading(true);
    void load();
  }

  const total = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-[#080D0F] text-white sm:-mx-6 sm:-mt-6">
      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#B6F70B]/50 bg-[#B6F70B]/5">
              <CreditCard className="h-5 w-5 text-[#B6F70B]" />
            </span>
            <div>
              <h1 className="text-[22px] font-extrabold tracking-tight text-white">
                Transactions
              </h1>
              <p className="mt-1.5 text-[11px] text-gray-500">
                Verified Stripe payments recorded by the webhook.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-[#141C21] px-3 text-[11px] font-bold text-gray-300 hover:text-white"
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.07] bg-[#0D1417] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Paid transactions
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">{payments.length}</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#0D1417] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Total collected
            </p>
            <p className="mt-1 text-2xl font-extrabold text-[#B6F70B]">
              ${(total / 100).toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#0D1417] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Status
            </p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-400">Paid</p>
          </div>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/5 px-4 py-3 text-[12px] font-semibold text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0D1417]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead className="bg-[#111A1D] text-[10px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-bold">User</th>
                  <th className="px-4 py-3 font-bold">Role</th>
                  <th className="px-4 py-3 font-bold">Plan</th>
                  <th className="px-4 py-3 font-bold">Amount</th>
                  <th className="px-4 py-3 font-bold">Transaction</th>
                  <th className="px-4 py-3 font-bold">Paid at</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[12px] text-gray-500">
                      {loading ? "Loading..." : "No payments recorded yet."}
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-t border-white/[0.05] text-[11px] text-gray-300"
                    >
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{payment.userName || "—"}</p>
                        <p className="text-[10px] text-gray-500">{payment.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 capitalize">{payment.userRole}</td>
                      <td className="px-4 py-3 font-semibold text-[#B6F70B]">
                        {payment.planName}
                      </td>
                      <td className="px-4 py-3 font-bold">
                        ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-gray-400">
                        {payment.transactionId}
                      </td>
                      <td className="px-4 py-3">{formatDate(payment.paidAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
