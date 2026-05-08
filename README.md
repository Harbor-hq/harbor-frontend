# Harbor Frontend

Web frontend for [Harbor](https://github.com/Harbor-hq/harbor) — on-chain batch
payroll powered by the `hedegpay_batch` Soroban contract.

- **Dashboard** — live contract state (admin, treasury, token, batch counter)
- **Invoices** — compose a payout batch and submit it via `execute_batch_payroll`
- **Ledger** — history of `payout_logged` events from the off-chain listener
- **Settings** — point the app at your deployed contract / RPC / network

Built with Next.js 14 (App Router), TypeScript, Tailwind, Freighter wallet, and
`@stellar/stellar-sdk` 12. All network access lives in `src/lib/harbor.ts`.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Install the
[Freighter](https://freighter.app) browser extension to connect a wallet.

### Configuration

The app defaults to the public Soroban testnet with a mock contract id so it
boots without setup. To talk to a real deployment:

1. Deploy `hedgepay_batch` (see `contracts/hedgepay_batch` in the upstream
   [harbor](https://github.com/Harbor-hq/harbor) repo).
2. `cp .env.local.example .env.local` and fill in
   `NEXT_PUBLIC_HARBOR_CONTRACT_ID`, `NEXT_PUBLIC_HARBOR_RPC_URL`, and
   `NEXT_PUBLIC_HARBOR_NETWORK_PASSPHRASE`.
3. Restart `npm run dev`.

Everything can also be overridden at runtime from **Settings** (stored in your
browser), which is handy for swapping networks without a rebuild.

## How it works

`src/lib/harbor.ts` is the single integration point with the contract:

- Read calls (`admin`, `treasury`, `token`, `max_batch_size`, `batch_counter`,
  `dex_router`) are simulate-only — no wallet needed.
- Write calls (`execute_batch_payroll`) follow a
  `build → simulate → sign (Freighter) → send → poll` pipeline. The connected
  wallet must be the contract **treasury**, since the contract enforces
  `treasury.require_auth()`.

UI components never import the Stellar SDK directly — see
[docs/ROADMAP.md](docs/ROADMAP.md) for the next contribution opportunities and
[CONTRIBUTING.md](CONTRIBUTING.md) for how to land changes.
