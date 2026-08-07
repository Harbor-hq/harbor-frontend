"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BatchUtilization() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("harbor.batch.draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Count rows with payee or amount filled
          const activeRows = parsed.filter(
            (r: any) => r.payee?.trim() || r.amount?.trim()
          );
          setCount(activeRows.length);
        }
      }
    } catch {}
  }, []);

  const maxBatch = 100;
  const percentage = Math.min(100, Math.round((count / maxBatch) * 100));

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">
          Batch Draft Utilization
        </h3>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {count} / {maxBatch} Payees ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
        <div
          className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400 dark:text-slate-500">
          {count === 0
            ? "No active draft items."
            : `${count} item(s) pending submission.`}
        </span>
        {count > 0 && (
          <Link
            href="/invoices"
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Resume draft →
          </Link>
        )}
      </div>
    </div>
  );
}
