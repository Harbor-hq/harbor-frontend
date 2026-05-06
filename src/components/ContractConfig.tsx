"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearOverrides,
  getConfig,
  getContractStatus,
  networkPassphrases,
  saveOverrides,
  type NetworkConfig,
} from "@/lib/harbor";

export default function ContractConfig() {
  const [config, setConfig] = useState<NetworkConfig>(() => getConfig());
  const [draft, setDraft] = useState<NetworkConfig>(() => getConfig());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(getConfig());
  }, []);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  const apply = () => {
    saveOverrides({
      contractId: draft.contractId,
      rpcUrl: draft.rpcUrl,
      networkPassphrase: draft.networkPassphrase,
      tokenDecimals: draft.tokenDecimals,
    });
    setConfig(getConfig());
    setSaved(true);
  };

  const reset = () => {
    clearOverrides();
    const fresh = getConfig();
    setConfig(fresh);
    setDraft(fresh);
    setSaved(true);
  };

  const refresh = useCallback(async () => {
    const res = await getContractStatus();
    return res.ok ? res.status : null;
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold">Network configuration</h2>
        <p className="mb-4 text-sm text-slate-500">
          Overrides are stored in your browser. Prefer setting{" "}
          <code className="font-mono">NEXT_PUBLIC_HARBOR_*</code> env vars for
          deployments.
        </p>

        <div className="grid gap-4">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Contract id
            </span>
            <input
              value={draft.contractId}
              onChange={(e) =>
                setDraft({ ...draft, contractId: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              RPC URL
            </span>
            <input
              value={draft.rpcUrl}
              onChange={(e) => setDraft({ ...draft, rpcUrl: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Network passphrase
              </span>
              <select
                value={draft.networkPassphrase}
                onChange={(e) =>
                  setDraft({ ...draft, networkPassphrase: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              >
                {networkPassphrases.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Token decimals
              </span>
              <input
                type="number"
                min={0}
                max={18}
                value={draft.tokenDecimals}
                onChange={(e) =>
                  setDraft({ ...draft, tokenDecimals: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={apply}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Save
            </button>
            <button
              onClick={reset}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Reset to env defaults
            </button>
            {saved && (
              <span className="self-center text-sm text-emerald-700">
                Saved — active config updated.
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold">Active configuration</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Contract id
            </dt>
            <dd className="mt-1 break-all font-mono">{config.contractId}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              RPC URL
            </dt>
            <dd className="mt-1 break-all font-mono">{config.rpcUrl}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Network passphrase
            </dt>
            <dd className="mt-1 font-mono">{config.networkPassphrase}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Token decimals
            </dt>
            <dd className="mt-1 font-mono">{config.tokenDecimals}</dd>
          </div>
        </dl>
        <button
          onClick={async () => {
            await refresh();
            alert("Contract reachable — check the dashboard for full state.");
          }}
          className="mt-4 text-sm text-slate-500 underline-offset-2 hover:underline"
        >
          Test connection
        </button>
      </section>
    </div>
  );
}