"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPayoutEvents, type PayoutEvent } from "@/lib/harbor";

type Events =
  | { kind: "loading" }
  | { kind: "ok"; events: PayoutEvent[] }
  | { kind: "error"; message: string };

export default function PayoutEvents() {
  const [state, setState] = useState<Events>({ kind: "loading" });
  const [filter, setFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

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
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const allEvents = state.kind === "ok" ? state.events : [];
  const filteredEvents = allEvents.filter(
    (e) =>
      !filter.trim() ||
      e.payee.toLowerCase().includes(filter.toLowerCase()) ||
      e.batchId.toString().includes(filter)
  );

  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;
  const paginatedEvents = filteredEvents.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const exportToCsv = () => {
    if (filteredEvents.length === 0) return;
    const headers = ["batchId", "payee", "amount", "token", "txHash", "date"];
    const csvContent = [
      headers.join(","),
      ...filteredEvents.map((e) =>
        [e.batchId, e.payee, e.amount, e.token, e.txHash, e.date].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `harbor_ledger_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Recent payouts</h2>
        <div className="flex items-center gap-3">
          <input
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPageIndex(0);
            }}
            placeholder="Filter by payee or batch..."
            className="rounded-md border border-slate-300 px-3 py-1 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
          {filteredEvents.length > 0 && (
            <button
              onClick={exportToCsv}
              className="text-xs text-indigo-600 underline-offset-2 hover:underline font-medium dark:text-indigo-400"
            >
              CSV export
            </button>
          )}
          <button
            onClick={load}
            className="text-xs text-slate-500 underline-offset-2 hover:underline"
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

      {state.kind === "ok" && allEvents.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
          No payout events yet. The off-chain listener indexes payout events and
          surfaces them via API.
        </div>
      )}

      {state.kind === "ok" && allEvents.length > 0 && (
        <>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="pb-2 pr-4 font-medium">Batch</th>
                  <th className="pb-2 pr-4 font-medium">Payee</th>
                  <th className="pb-2 pr-4 font-medium">Amount</th>
                  <th className="pb-2 pr-4 font-medium">Tx Hash</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvents.map((e) => (
                  <tr
                    key={`${e.txHash}-${e.index}`}
                    className="border-b border-slate-100 dark:border-slate-800/50"
                  >
                    <td className="py-2 pr-4 font-mono">#{e.batchId}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{e.payee}</td>
                    <td className="py-2 pr-4 font-semibold">{e.amount}</td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${e.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {e.txHash.slice(0, 8)}…
                      </a>
                    </td>
                    <td className="py-2 text-xs text-slate-500">{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <span className="text-slate-500">
              Page {pageIndex + 1} of {totalPages} ({filteredEvents.length}{" "}
              items)
            </span>
            <div className="flex gap-2">
              <button
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((p) => p - 1)}
                className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
              >
                Previous
              </button>
              <button
                disabled={pageIndex >= totalPages - 1}
                onClick={() => setPageIndex((p) => p + 1)}
                className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}