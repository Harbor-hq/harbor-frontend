"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPayoutEvents, type PayoutEvent } from "@/lib/harbor";

type Events =
  | { kind: "loading" }
  | { kind: "ok"; events: PayoutEvent[] }
  | { kind: "error"; message: string };

export default function PayoutEvents() {
  const [state, setState] = useState<Events>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "ok", events: await fetchPayoutEvents() });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const exportToCsv = () => {
    if (state.kind !== "ok" || state.events.length === 0) return;
    const headers = ["payee", "amount", "department", "target_token"];
    const csvContent = [
      headers.join(","),
      ...state.events.map((e) =>
        [e.payee, e.amount, "", ""].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `harbor_ledger_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent payouts</h2>
        <div className="flex gap-4">
          {state.kind === "ok" && state.events.length > 0 && (
            <button
              onClick={exportToCsv}
              className="text-sm text-indigo-600 underline-offset-2 hover:underline font-medium"
            >
              export to CSV
            </button>
          )}
          <button
            onClick={load}
            className="text-sm text-slate-500 underline-offset-2 hover:underline"
          >
            refresh
          </button>
        </div>
      </div>

      {state.kind === "loading" && (
        <p className="text-sm text-slate-500">Loading payouts…</p>
      )}

      {state.kind === "error" && (
        <p className="text-sm text-red-700">{state.message}</p>
      )}

      {state.kind === "ok" && state.events.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No payout events yet. The off-chain listener (upstream{" "}
          <code className="font-mono">listener/index.js</code>) indexes{" "}
          <code className="font-mono">payout_logged</code> events and surfaces
          them via an HTTP API. Point{" "}
          <code className="font-mono">NEXT_PUBLIC_HARBOR_EVENTS_URL</code> at it
          once deployed — see docs/ROADMAP.md.
        </div>
      )}

      {state.kind === "ok" && state.events.length > 0 && (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4 font-medium">Batch</th>
                <th className="pb-2 pr-4 font-medium">Payee</th>
                <th className="pb-2 pr-4 font-medium">Amount</th>
                <th className="pb-2 pr-4 font-medium">Token</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {state.events.map((e) => (
                <tr key={`${e.txHash}-${e.index}`} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-mono">#{e.batchId}</td>
                  <td className="py-2 pr-4 font-mono">{e.payee}</td>
                  <td className="py-2 pr-4">{e.amount}</td>
                  <td className="py-2 pr-4 font-mono">{e.token}</td>
                  <td className="py-2 text-slate-500">{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}