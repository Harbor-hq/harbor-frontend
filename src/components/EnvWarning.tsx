"use client";

import { useState, useEffect } from "react";

export default function EnvWarning() {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const list: string[] = [];
    const contractId = process.env.NEXT_PUBLIC_HARBOR_CONTRACT_ID;
    const eventsUrl = process.env.NEXT_PUBLIC_HARBOR_EVENTS_URL;

    if (!contractId) {
      list.push("NEXT_PUBLIC_HARBOR_CONTRACT_ID is missing.");
    } else if (contractId === "CD4U2T3X5K7G2J6L4A8B9Z1Y0W_MOCK_CONTRACT_ID") {
      list.push("Using MOCK_CONTRACT_ID placeholder. No real events will index.");
    }

    if (!eventsUrl) {
      list.push("NEXT_PUBLIC_HARBOR_EVENTS_URL is missing. Recent payouts feed will be empty.");
    }

    setWarnings(list);
  }, []);

  if (warnings.length === 0 || dismissed) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2.5 text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
      <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <div>
            <span className="font-semibold mr-1">Configuration Warning:</span>
            {warnings.join(" ")}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-200 font-bold px-1"
          aria-label="Dismiss warning"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
