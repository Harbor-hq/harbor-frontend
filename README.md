<div align="center">

# Harbor Frontend

**Web frontend for on-chain batch payroll on Stellar.**

Next.js dashboard, invoice builder, and ledger for the `hedegpay_batch`<br/>
Soroban payroll contract — connect Freighter, submit batches, watch payouts land.

![Next.js 14](https://img.shields.io/badge/next.js-14.2-black)
![React 18](https://img.shields.io/badge/react-%5E18.0-61dafb)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0-3178c6)
![Stellar SDK 12](https://img.shields.io/badge/stellar--sdk-%5E12.3-6f42c1)
![Freighter](https://img.shields.io/badge/wallet-freighter-orange)

Part of the [Harbor](https://github.com/Harbor-hq/harbor) ecosystem.

</div>

---

## Overview

`harbor-frontend` is the UI for **Harbor**, an on-chain batch payroll system built on a Soroban smart contract (`hedegpay_batch`). It lets a treasury wallet compose a set of payouts, submit them in a single on-chain transaction, and gives the whole team a live view of contract state and payout history.

The app ships with four surfaces:

- **Dashboard** — live contract state (admin, treasury, token, DEX router, batch counter)
- **Invoices** — compose a payout batch and submit it via `execute_batch_payroll`
- **Ledger** — history of `payout_logged` events from the off-chain listener
- **Settings** — point the app at your deployed contract, RPC endpoint, and network, with browser-persisted overrides

It works out of the box against the public Soroban testnet with a mock contract id, so you can run it before deploying anything.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [The Contract Integration Layer (`src/lib/harbor.ts`)](#the-contract-integration-layer-srclibharborts)
- [Wallet Integration](#wallet-integration)
- [Components](#components)
- [Pages](#pages)
- [Amount Handling](#amount-handling)
- [Error States](#error-states)
- [Development](#development)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Installation

```bash
git clone https://github.com/Harbor-hq/harbor-frontend.git
cd harbor-frontend
npm install
```

Install the [Freighter](https://freighter.app) browser extension to connect a wallet — the app runs without it, but wallet-gated actions (submitting a batch) require it.

---

## Quick Start

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll land on `/dashboard`, which reads live state from a mock contract id on the public Soroban testnet — no setup required to explore the UI.

---

## Configuration

Configuration is layered, in priority order:

1. **Runtime overrides** — Set from the **Settings** page and persisted in the browser's `localStorage` (`harbor.config.overrides`). These overrides take priority, allowing quick network/contract swaps without rebuilding the application.
2. **Build-time env vars** — Loaded from `.env.local` during build/start (prefix `NEXT_PUBLIC_HARBOR_*`).
3. **Defaults** — Public Soroban testnet defaults with a mock contract ID.

### Environment Variables Reference Table

Copy `.env.local.example` to `.env.local` and define the following variables:

| Variable Name | Purpose / Description | Default Value | Example Value |
|---|---|---|---|
| `NEXT_PUBLIC_HARBOR_CONTRACT_ID` | Deployed C-address of the `hedgepay_batch` contract | `CD4U2T3X5K7G2J6L4A8B9Z1Y0W_MOCK_CONTRACT_ID` | `CDQMLR7BUWEGNRVVMVYQYBTANAG3JXLDRR4V4RZYPOOG53XDKGC3PJYQ` |
| `NEXT_PUBLIC_HARBOR_RPC_URL` | Soroban RPC endpoint URL | `https://soroban-testnet.stellar.org` | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_HARBOR_NETWORK_PASSPHRASE` | Passphrase indicating the Stellar network to connect to | `Test SDF Network ; September 2015` | `Public Global Stellar Network ; October 2015` |
| `NEXT_PUBLIC_HARBOR_TOKEN_DECIMALS` | Decimals of the base settlement token (USDC = 6) | `6` | `6` |
| `NEXT_PUBLIC_HARBOR_EVENTS_URL` | HTTP API exposed by the payout listener (`harbor-backend`) | unset (Ledger returns no events) | `http://localhost:8787/payouts` |

Every one of these variables can be overridden at runtime from the **Settings** page in the dashboard interface, which persists overrides in `localStorage`.

---

## Deployment

For step-by-step instructions on deploying the Harbor frontend, please see the [Harbor Frontend Deployment Guide](docs/DEPLOYMENT.md). It covers:
- Deploying directly to **Vercel** (the easiest path)
- **Self-hosting** using standard `npm run build && npm start` configurations
- Managing environment variables and runtime overrides in production environments


---

## Project Structure

```
harbor-frontend/
├── docs/
│   └── ROADMAP.md            # curated list of contribution opportunities
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx           → redirects to /dashboard
│   │   ├── layout.tsx          root layout, fonts, <Nav />
│   │   ├── globals.css
│   │   ├── dashboard/page.tsx
│   │   ├── invoices/page.tsx
│   │   ├── ledger/page.tsx
│   │   └── settings/page.tsx
│   ├── components/
│   │   ├── Nav.tsx
│   │   ├── WalletButton.tsx
│   │   ├── ContractStatus.tsx
│   │   ├── ContractConfig.tsx
│   │   ├── BatchPayoutForm.tsx
│   │   └── PayoutEvents.tsx
│   └── lib/
│       ├── harbor.ts         # single point of contract/network integration
│       └── useWallet.ts      # shared wallet-state hook
├── .env.local.example
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## Architecture

The guiding rule of this codebase: **all Stellar/Soroban SDK usage lives in `src/lib/harbor.ts`.** UI components never import `@stellar/stellar-sdk` directly — they call typed functions from `harbor.ts` and render the result. This keeps the network/contract logic testable and swappable in one place, and keeps components dumb.

```
┌─────────────┐      ┌──────────────────┐      ┌────────────────────┐
│  UI pages / │ ───▶ │  src/lib/harbor.ts │ ───▶ │ Soroban RPC /       │
│  components │      │  (typed functions) │      │ Freighter wallet    │
└─────────────┘      └──────────────────┘      └────────────────────┘
        │                                                  │
        └──────────────── useWallet() hook ◀───────────────┘
```

- **Server components** are used for static shells (page metadata, layout).
- **`"use client"`** is used only where wallet state or async data fetching is needed (`WalletButton`, `ContractStatus`, `BatchPayoutForm`, `PayoutEvents`, `ContractConfig`).

---

## The Contract Integration Layer (`src/lib/harbor.ts`)

This file is the single source of truth for talking to the `hedegpay_batch` contract and the Stellar network. Its main exports:

### Configuration

```ts
getConfig(): NetworkConfig
getOverrides(): Partial<NetworkConfig>
saveOverrides(overrides: Partial<NetworkConfig>): void
clearOverrides(): void
getServer(config?): SorobanRpc.Server
```

`getConfig()` merges runtime overrides → env vars → defaults, as described in [Configuration](#configuration).

### Amount helpers

The contract stores amounts as base-unit `i128` integers. These helpers convert to/from human decimal strings:

```ts
toBaseUnits(value: string, decimals?): bigint     // "123.45" → 123450000n (6 decimals)
fromBaseUnits(value: bigint | number | string, decimals?): string
```

> **Rule:** never pass a raw human-entered amount straight to the contract — always route it through `toBaseUnits`.

### Read-only queries

```ts
getContractStatus(source?, config?): Promise<
  | { ok: true; status: ContractStatus }
  | { ok: false; error: string; notInitialized?: boolean }
>
```

Reads `admin`, `treasury`, `token`, `max_batch_size`, `batch_counter`, and `dex_router` via simulated (no-signature, no-wallet) calls. If no wallet is connected, a throwaway random keypair is used as the simulation source. Returns `notInitialized: true` when the contract hasn't been initialized yet, so the UI can show a helpful banner instead of a raw error.

### Write path

```ts
executeBatchPayroll(
  request: BatchRequestInput,
  walletPublicKey: string,
  config?
): Promise<SubmitResult>
```

Submits a payroll batch. Follows a fixed pipeline that every new write path should copy:

1. **Build** — construct the `execute_batch_payroll` operation with a `BatchRequest` ScVal.
2. **Simulate** — estimate the resource fee via `simulateTransaction`.
3. **Sign** — rebuild with the correct fee and sign via Freighter (`signWithFreighter`), which also asserts the wallet's active network matches the app's configured network.
4. **Send** — submit via `sendTransaction`.
5. **Poll** — poll `getTransaction` for up to 30 seconds; returns `"success"`, `"error"`, or `"pending"` if the deadline is hit before finality.

The connected wallet **must be the contract's treasury address** — the contract enforces `treasury.require_auth()`, so any other signer gets an on-chain `Unauthorized` revert.

### Off-chain events

```ts
fetchPayoutEvents(): Promise<PayoutEvent[]>
```

Fetches recent `payout_logged` events from the URL in `NEXT_PUBLIC_HARBOR_EVENTS_URL`. That endpoint is produced by the off-chain listener in the upstream [`Harbor-hq/harbor`](https://github.com/Harbor-hq/harbor) repo (`listener/index.js`). If the env var is unset, this resolves to an empty array so the Ledger UI stays stable rather than erroring.

### Key domain types

```ts
interface PayoutItemInput {
  payee: string;          // Stellar account (G...)
  amount: string;          // human decimal, e.g. "250.50"
  department?: string;     // cost-centre symbol
  targetToken?: string;    // optional swap target (defaults to base token)
}

interface BatchRequestInput {
  items: PayoutItemInput[];
  declaredTotal: string;
  batchId: string;
}

interface ContractStatus {
  admin: string;
  treasury: string;
  token: string;
  maxBatchSize: number;
  batchCounter: string;
  dexRouter: string;
}

interface PayoutEvent {
  batchId: string;
  index: number;
  txHash: string;
  ledger: number;
  payee: string;
  amount: string;
  token: string;
  date: string;
}
```

---

## Wallet Integration

Wallet state is exposed via a small React hook, `useWallet()` (`src/lib/useWallet.ts`), which wraps the Freighter-facing functions in `harbor.ts`:

```tsx
import { useWallet, shortAddress } from "@/lib/useWallet";

function Example() {
  const { available, publicKey, connect, disconnect, refresh } = useWallet();

  if (!available) return <p>Install Freighter</p>;
  if (!publicKey) return <button onClick={() => connect()}>Connect</button>;

  return <span>{shortAddress(publicKey)}</span>;
}
```

- `available` — whether the Freighter extension is detected.
- `publicKey` — the connected account, or `null`.
- `connect()` — requests wallet access and resolves the public key.
- `disconnect()` — clears local wallet state (does not revoke extension access).
- `shortAddress(address)` — formats a G-address as `GABCDE…WXYZ` for display.

`WalletButton` (`src/components/WalletButton.tsx`) is the canonical consumer of this hook and renders all three states: extension missing, extension present but disconnected, and connected.

---

## Components

| Component | File | Responsibility |
|---|---|---|
| `Nav` | `components/Nav.tsx` | Top navigation bar linking Dashboard / Invoices / Ledger / Settings |
| `WalletButton` | `components/WalletButton.tsx` | Connect/disconnect Freighter, show short address |
| `ContractStatus` | `components/ContractStatus.tsx` | Reads and displays live contract state via `getContractStatus`; shows a "not initialized" banner when relevant |
| `ContractConfig` | `components/ContractConfig.tsx` | Settings-page form for overriding contract id / RPC URL / network / decimals, backed by `saveOverrides` / `clearOverrides` |
| `BatchPayoutForm` | `components/BatchPayoutForm.tsx` | Compose payout rows, declared total, and batch id; submits via `executeBatchPayroll` |
| `PayoutEvents` | `components/PayoutEvents.tsx` | Lists recent `payout_logged` events via `fetchPayoutEvents` |

All components other than `Nav` are client components (`"use client"`) since they depend on wallet state or async data.

---

## Pages

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Redirects to `/dashboard` |
| `/dashboard` | `app/dashboard/page.tsx` | `ContractStatus` + links into Invoices and Ledger |
| `/invoices` | `app/invoices/page.tsx` | `BatchPayoutForm` — build and submit a payroll batch |
| `/ledger` | `app/ledger/page.tsx` | `PayoutEvents` — history of processed batches |
| `/settings` | `app/settings/page.tsx` | `ContractConfig` — override contract id / RPC / network / decimals |

Routing is Next.js 14 App Router; `layout.tsx` sets up local fonts (Geist Sans/Mono), page metadata, and wraps every route in `<Nav />` plus a centered `max-w-5xl` container.

---

## Amount Handling

The contract's `PayoutItem.amount` and `BatchRequest.declared_total` are `i128` values in base units (e.g. for a 6-decimal token, `1.00` is stored as `1_000_000`). The frontend never sends a raw decimal string to the contract:

```ts
toBaseUnits("250.50")     // -> 250500000n   (at 6 decimals)
fromBaseUnits(250500000n) // -> "250.5"
```

`toBaseUnits` throws on empty or malformed input (`Invalid amount: ...`), which `BatchPayoutForm` surfaces as an inline validation error before a transaction is ever built.

---

## Error States

The integration layer favors typed, recoverable results over thrown exceptions in the UI path:

- `getContractStatus` returns a discriminated union (`ok: true | false`) rather than throwing, with `notInitialized` flagged separately so `ContractStatus` can render a specific "run `initialize`" banner instead of a generic error.
- `executeBatchPayroll` returns a `SubmitResult` with `status: "success" | "error" | "pending"` — a stalled poll (>30s without finality) resolves as `"pending"` with a `txHash` you can look up later, not an exception.
- `signWithFreighter` explicitly checks that the wallet's active network passphrase matches the app's configured network before signing, and throws a clear "Network mismatch" error if not.

---

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build       # Next.js type-checks during build
```

There is no separate test suite in this repo at present — correctness is enforced via TypeScript's build-time type-checking (`npm run build`) and lint rules (`npm run lint`).

---

## Contributing

Harbor-frontend is deliberately built as a foundation for community contribution. Ground rules (enforced in review):

- Keep **every** network/contract interaction inside `src/lib/harbor.ts` — UI components must not import `@stellar/stellar-sdk` directly.
- Reuse the `build → simulate → sign (Freighter) → send → poll` pattern from `executeBatchPayroll` for any new write path.
- Server components for static shells; `"use client"` only where wallet or async state is required.
- Config flows through `getConfig()` (runtime override → env → default) — don't read `process.env` directly in components.
- Amounts are always converted with `toBaseUnits` / `fromBaseUnits`, never passed raw.
- No new dependencies without discussing in the PR first — the SDK surface is intentionally small.

**Submitting a PR:**

1. Fork and branch: `git checkout -b feat/my-thing`
2. Keep the diff focused on one roadmap item
3. `npm run lint && npm run build`
4. Open the PR referencing the tracking issue (`Fixes #N`)

Full details in [CONTRIBUTING.md](https://github.com/Harbor-hq/harbor-frontend/blob/main/CONTRIBUTING.md).

---

## Roadmap

See [docs/ROADMAP.md](https://github.com/Harbor-hq/harbor-frontend/blob/main/docs/ROADMAP.md) for the full, scoped list. Highlights, smallest first:

1. **Point at a real deployed contract** — deploy `hedgepay_batch` and set the three env vars; no code changes needed.
2. **Contract initialization UI** — the contract rejects all calls until `initialize(admin, treasury, token)` runs; there's currently no UI for it.
3. **Admin functions** — wire `update_admin`, `update_treasury`, `update_max_batch`, `update_dex_router` into Settings.
4. **Payout events API + Ledger** — stand up the off-chain listener's HTTP API and point `NEXT_PUBLIC_HARBOR_EVENTS_URL` at it.
5. **Client-side batch validation** — enforce `max_batch_size` and total-sum matching before submit, instead of failing on-chain.
6. **CSV import** for bulk-loading payout rows.
7. **Multi-signature treasury support** (larger effort) — collect signatures from every signer when the treasury is a multisig account.
8. **Swap routing UX** (larger effort) — preview and surface per-item DEX swap status when `target_token` is set.
9. **Governance / batch approval workflow** (larger effort) — role-based propose/approve flow for pending batches.

---

## License

See the repository for license details.
