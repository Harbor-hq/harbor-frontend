# Roadmap & contribution opportunities

Harbor-frontend is intentionally built as a **foundation** for a growing open
source community. The contract-integration layer (`src/lib/harbor.ts`) is
complete and the four core surfaces (Dashboard, Invoices, Ledger, Settings) are
wired to it. Everything below is a well-scoped, self-contained extension point
that keeps the existing architecture.

Each item lists the files it touches and the acceptance criteria so any
contributor can pick it up and land it as a PR.

## Ready to pick up

### 1. Point at a real deployed contract (small)
- **Why**: the app currently defaults to a mock contract id on Soroban testnet.
- **What**: deploy `hedgepay_batch` from `Harbor-hq/harbor`
  (`contracts/hedgepay_batch`), then set `NEXT_PUBLIC_HARBOR_CONTRACT_ID`,
  `NEXT_PUBLIC_HARBOR_RPC_URL`, and `NEXT_PUBLIC_HARBOR_NETWORK_PASSPHRASE` in
  the deployment env. No code change needed.
- **Acceptance**: Dashboard shows real admin/treasury/token state.

### 2. Contract initialization UI (small–medium)
- **Why**: the contract rejects every call until `initialize(admin, treasury,
  token)` runs; there is no UI for it yet.
- **What**: add an "Initialize" panel to `src/components/ContractConfig.tsx`
  that calls `initialize` with the connected wallet as admin. Add
  `initializeContract(admin, treasury, token)` to `src/lib/harbor.ts` using the
  same build/simulate/sign/send pattern as `executeBatchPayroll`.
- **Files**: `src/lib/harbor.ts`, `src/components/ContractConfig.tsx`.
- **Acceptance**: after initialize, the dashboard `NotInitialized` banner
  disappears and the contract's own storage reflects the set values.

### 3. Admin functions (medium)
- **What**: wire `update_admin`, `update_treasury`, `update_max_batch`,
  `update_dex_router` into Settings, gated on the connected wallet being the
  contract admin.
- **Files**: `src/lib/harbor.ts`, `src/components/ContractConfig.tsx`.
- **Acceptance**: admin wallet can change treasury/max-batch and the dashboard
  reflects it; non-admin wallets get a clean Unauthorized error.

### 4. Payout events API + ledger (medium)
- **Why**: `PayoutEvents` returns an empty list until an HTTP events endpoint
  exists. The off-chain listener in `Harbor-hq/harbor` (`listener/index.js`)
  indexes `payout_logged` events.
- **What**: deploy the listener, expose a small HTTP API (e.g. Worker or the
  existing listener process) serving recent payouts, and set
  `NEXT_PUBLIC_HARBOR_EVENTS_URL`. Extend `fetchPayoutEvents` with pagination
  if needed.
- **Files**: `src/lib/harbor.ts`, `src/components/PayoutEvents.tsx`.
- **Acceptance**: Ledger lists real batches with payee/amount/token/date.

### 5. Batch size + total validation (small)
- **What**: enforce `max_batch_size` and `SumMismatch` on the client before
  submit (show inline errors rather than a failed tx).
- **Files**: `src/components/BatchPayoutForm.tsx`, `src/lib/harbor.ts`.
- **Acceptance**: form blocks batches over the contract max and totals that
  don't match the declared total.

### 6. CSV import (small, existing pattern)
- **What**: reuse the CSV import pattern from the upstream app to bulk-load
  payout rows into `BatchPayoutForm` instead of typing them.
- **Files**: `src/components/BatchPayoutForm.tsx`, new `CsvUpload` component.

## Larger efforts

### 7. Multi-signature treasury
- `execute_batch_payroll` enforces `treasury.require_auth()`. For treasuries
  that are multisig accounts (GAB…M + signers), the app must collect signatures
  from every signer (Freighter `signAuthEntry` / `signTransaction`) before
  submitting. Design an invitation/share-link flow for remote signers.

### 8. Swap routing UX
- `PayoutItem.target_token` triggers an on-chain DEX swap via the configured
  `dex_router`. Add UI to preview expected amounts and show
  per-item swap status in the Ledger.

### 9. Governance / batch approval workflow
- Role-based dashboards (finance ops propose, treasury approves) plus a
  persisted list of pending batches to sign.

## Contribution guidelines

- Keep all network/contract access inside `src/lib/harbor.ts`; UI components
  must not import `@stellar/stellar-sdk` directly.
- Use the `build → simulate → sign(Freighter) → send → poll` pattern from
  `executeBatchPayroll` for every write path.
- Server components for static shells; `"use client"` only where wallet/async
  state is needed.
- Verify with `npm run build` (Next.js type-checks on build) and `npm run lint`.
- Tag the issue number in the PR (`Fixes #N`).
