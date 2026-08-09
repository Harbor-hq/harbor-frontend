"use client";

import { useEffect, useState } from "react";
import { getContractStatus, fromBaseUnits, toBaseUnits } from "@/lib/harbor";
import { useWallet } from "@/lib/useWallet";

export default function BatchSummary() {
  const { publicKey } = useWallet();
  const [nextBatchId, setNextBatchId] = useState("1");
  const [itemCount, setItemCount] = useState(0);
  const [totalValue, setTotalValue] = useState("0.00");

  useEffect(() => {
    (async () => {
      try {
        const res = await getContractStatus();
        if (res.ok) {
          setNextBatchId(String(BigInt(res.status.batchCounter) + BigInt(1)));
        }
      } catch {}
    })();
  }, [publicKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("harbor.batch.draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const activeRows = parsed.filter(
            (r: any) => r.payee?.trim() && r.amount?.trim()
          );
          setItemCount(activeRows.length);

          let sum = BigInt(0);
          for (const row of activeRows) {
            try {
              sum += toBaseUnits(row.amount);
            } catch {}
          }
          setTotalValue(fromBaseUnits(sum));
        }
      }
    } catch {}
  }, []);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Next Batch ID
        </dt>
        <dd className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
          #{nextBatchId}
        </dd>
      </div>
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Draft Payees Count
        </dt>
        <dd className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
          {itemCount} items
        </dd>
      </div>
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Total Draft Value
        </dt>
        <dd className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
          {totalValue} USDC
        </dd>
      </div>
    </div>
  );
}
