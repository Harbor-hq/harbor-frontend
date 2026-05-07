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

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent payouts</h2>
        <button
          onClick={load}
          className="text-sm text-slate-500 underline-offset-2 hover:underline"
        >
          refresh
        </button>
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
        <table className="w-full text-left text-sm">
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
      )}
    </section>
  );
}