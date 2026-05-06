"use client";

import { useWallet, shortAddress } from "@/lib/useWallet";

export default function WalletButton() {
  const { available, publicKey, connect, disconnect } = useWallet();

  if (!available) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-500">
        Freighter extension not detected
        <a
          href="https://freighter.app"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-slate-700 underline"
        >
          install
        </a>
      </span>
    );
  }

  if (!publicKey) {
    return (
      <button
        onClick={() => connect()}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        Connect Freighter
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      <span className="font-mono text-emerald-800" title={publicKey}>
        {shortAddress(publicKey)}
      </span>
      <button
        onClick={disconnect}
        className="text-emerald-700 underline-offset-2 hover:underline"
      >
        disconnect
      </button>
    </span>
  );
}