"use client";

import { useEffect, useMemo, useState } from "react";
import {
  executeBatchPayroll,
  fromBaseUnits,
  getContractStatus,
  toBaseUnits,
  type PayoutItemInput,
  type SubmitResult,
} from "@/lib/harbor";
import { useWallet } from "@/lib/useWallet";

interface Row extends PayoutItemInput {
  id: string;
}

function newRow(): Row {
  return {
    id: Math.random().toString(36).slice(2),
    payee: "",
    amount: "",
    department: "",
    targetToken: "",
  };
}

export default function BatchPayoutForm() {
  const { publicKey, connect } = useWallet();
  const [rows, setRows] = useState<Row[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("harbor.batch.draft");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [newRow()];
  });
  const [batchId, setBatchId] = useState("");
  const [declaredTotal, setDeclaredTotal] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [treasury, setTreasury] = useState<string | null>(null);
  const [maxBatchSize, setMaxBatchSize] = useState<number>(100);

  useEffect(() => {
    localStorage.setItem("harbor.batch.draft", JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    (async () => {
      const status = await getContractStatus(publicKey ?? undefined);
      if (status.ok) {
        setTreasury(status.status.treasury);
        setMaxBatchSize(status.status.maxBatchSize);
        if (!batchId) {
          setBatchId(String(BigInt(status.status.batchCounter) + BigInt(1)));
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  const autoTotal = useMemo(
    () =>
      rows.reduce((sum, r) => {
        if (!r.amount.trim()) return sum;
        try {
          return sum + toBaseUnits(r.amount);
        } catch {
          return sum;
        }
      }, BigInt(0)),
    [rows]
  );

  const setRow = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const isTreasury =
    publicKey !== null && treasury !== null && publicKey === treasury;

  const handleSubmit = async () => {
    if (!publicKey) return;
    const items = rows.filter((r) => r.payee.trim() && r.amount.trim());
    const total = declaredTotal.trim() ? declaredTotal : fromBaseUnits(autoTotal);
    setBusy(true);
    setResult(null);
    try {
      const res = await executeBatchPayroll(
        {
          items,
          declaredTotal: total,
          batchId: batchId.trim() || "1",
        },
        publicKey
      );
      setResult(res);
      if (res.status === "success") {
        setRows([newRow()]);
        localStorage.removeItem("harbor.batch.draft");
      }
    } catch (err) {
      setResult({
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  };

  const activeItemsCount = rows.filter((r) => r.payee.trim() && r.amount.trim()).length;
  const isOverlimit = activeItemsCount > maxBatchSize;

  const canSubmit =
    publicKey !== null &&
    !busy &&
    !isOverlimit &&
    rows.some((r) => r.payee.trim() && r.amount.trim());

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">New payroll batch</h2>
        {!publicKey && (
          <button
            onClick={() => connect()}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Connect wallet to submit
          </button>
        )}
      </div>

      {publicKey && treasury && !isTreasury && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Warning: your wallet isn&apos;t the contract treasury.{" "}
          <code className="font-mono">execute_batch_payroll</code> requires the
          treasury to authorize the batch, so the on-chain call will revert with
          Unauthorized.
        </div>
      )}

      <div className="space-y-4">
        {/* Table Header - hidden on mobile */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_140px_140px_120px_auto] gap-2">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Payee
          </div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Amount
          </div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Department
          </div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Target token
          </div>
          <div />
        </div>

        {/* Rows */}
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr_140px_140px_120px_auto] items-center border border-slate-200 p-3 sm:border-0 sm:p-0 rounded-md bg-slate-50 sm:bg-transparent"
          >
            <div className="block sm:hidden text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Payee
            </div>
            <input
              value={row.payee}
              onChange={(e) => setRow(row.id, { payee: e.target.value })}
              placeholder="G…"
              aria-label="Payee wallet address or Federation ID"
              className="rounded-md border border-slate-300 px-3 py-1.5 font-mono text-sm focus:border-slate-500 focus:outline-none w-full"
            />
            <div className="block sm:hidden text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Amount
            </div>
            <input
              value={row.amount}
              onChange={(e) => setRow(row.id, { amount: e.target.value })}
              placeholder="0.00"
              inputMode="decimal"
              aria-label="Payout amount"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none w-full"
            />
            <div className="block sm:hidden text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Department
            </div>
            <input
              value={row.department}
              onChange={(e) => setRow(row.id, { department: e.target.value })}
              placeholder="eng"
              aria-label="Department Symbol"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none w-full"
            />
            <div className="block sm:hidden text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Target token
            </div>
            <input
              value={row.targetToken}
              onChange={(e) => setRow(row.id, { targetToken: e.target.value })}
              placeholder="C… (optional)"
              aria-label="Target token address (optional)"
              className="rounded-md border border-slate-300 px-3 py-1.5 font-mono text-sm focus:border-slate-500 focus:outline-none w-full"
            />
            <div className="flex justify-end pt-2 sm:pt-0">
              <button
                onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))}
                className="text-sm text-slate-400 hover:text-red-600 px-2 py-1 bg-slate-200 hover:bg-slate-300 sm:bg-transparent rounded-md"
                aria-label="Remove row"
              >
                ✕ <span className="sm:hidden text-xs font-normal font-sans ml-1">Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setRows((rs) => [...rs, newRow()])}
        className="mt-3 text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
      >
        + Add payee
      </button>

      <div className="mt-6 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Batch id
          </span>
          <input
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            placeholder="1"
            inputMode="numeric"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Declared total
          </span>
          <input
            value={declaredTotal}
            onChange={(e) => setDeclaredTotal(e.target.value)}
            placeholder={fromBaseUnits(autoTotal)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
          />
          <span className="mt-1 block text-xs text-slate-400">
            Sum of rows: {fromBaseUnits(autoTotal)} (auto)
          </span>
        </label>
        <div className="flex items-end">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Submitting…" : "Execute batch"}
          </button>
        </div>
      </div>

      {isOverlimit && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Warning: The batch contains {activeItemsCount} payouts, which exceeds the contract maximum limit of {maxBatchSize}. Please split them into smaller batches.
        </div>
      )}

      {result && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-4 rounded-md border p-3 text-sm ${
            result.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : result.status === "pending"
                ? "border-sky-200 bg-sky-50 text-sky-800"
                : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {result.status === "success" && (
            <span>
              Batch executed. Transaction:{" "}
              <span className="font-mono">{result.txHash}</span>
            </span>
          )}
          {result.status === "pending" && (
            <span>
              Submitted, awaiting confirmation. Transaction:{" "}
              <span className="font-mono">{result.txHash}</span>
            </span>
          )}
          {result.status === "error" && (
            <span className="font-mono">{result.error}</span>
          )}
        </div>
      )}
    </section>
  );
}