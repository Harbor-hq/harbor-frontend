"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getContractStatus,
  type ContractStatus,
} from "@/lib/harbor";
import { useWallet, shortAddress } from "@/lib/useWallet";

type Status =
  | { kind: "loading" }
  | { kind: "ok"; status: ContractStatus }
  | { kind: "error"; message: string; notInitialized: boolean };

export default function ContractStatus() {
  const { publicKey } = useWallet();
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  const load = useCallback(async () => {
    setStatus({ kind: "loading" });
    const res = await getContractStatus(publicKey ?? undefined);
    if (res.ok) {
      setStatus({ kind: "ok", status: res.status });
    } else {
      setStatus({
        kind: "error",
        message: res.error,
        notInitialized: res.notInitialized ?? false,
      });
    }
  }, [publicKey]);

  useEffect(() => {
    load();
  }, [load]);

  const rows: { label: string; value: string }[] =
    status.kind === "ok"
      ? [
          { label: "Admin", value: shortAddress(status.status.admin) || "—" },
          {
            label: "Treasury",
            value: status.status.treasuryBalance
              ? `${shortAddress(status.status.treasury)} (${status.status.treasuryBalance} USDC)`
              : shortAddress(status.status.treasury) || "—",
          },
          { label: "Token", value: shortAddress(status.status.token) || "—" },
          { label: "Dex router", value: shortAddress(status.status.dexRouter) || "—" },
          { label: "Max batch size", value: String(status.status.maxBatchSize) },
          { label: "Batches processed", value: status.status.batchCounter },
        ]
      : [];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contract status</h2>
        <button
          onClick={load}
          className="text-sm text-slate-500 underline-offset-2 hover:underline"
        >
          refresh
        </button>
      </div>

      {status.kind === "loading" && (
        <p className="text-sm text-slate-500">Reading contract state…</p>
      )}

      {status.kind === "error" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {status.notInitialized ? (
            <p>
              The contract isn&apos;t initialized on this network yet. Head to
              Settings to check the configured contract id, then run{" "}
              <code className="font-mono">initialize</code>.
            </p>
          ) : (
            <p>
              Could not read contract state:{" "}
              <span className="font-mono">{status.message}</span>
            </p>
          )}
        </div>
      )}

      {status.kind === "ok" && (
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {row.label}
              </dt>
              <dd className="mt-1 font-mono text-sm text-slate-900">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}