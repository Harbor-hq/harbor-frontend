# Contributing to Harbor Frontend

Thanks for contributing! Harbor-frontend is built to be picked apart and extended by the community — the contract-integration layer is complete and the four core surfaces (Dashboard, Invoices, Ledger, Settings) are wired to it, so most contributions are self-contained extensions rather than architectural changes. See [docs/ROADMAP.md](docs/ROADMAP.md) for the curated, scoped list of tasks with acceptance criteria.

---

## Ground rules

These are enforced in review — a PR that violates them will be asked to change before merge, regardless of how the feature itself looks.

- **Keep every network/contract interaction inside `src/lib/harbor.ts`.** UI components must not import `@stellar/stellar-sdk` directly. If a component needs new contract data, add a typed function to `harbor.ts` and call that from the component.
- **Reuse the write-path pattern.** Any new call that mutates contract state should follow the same `build → simulate → sign (Freighter) → send → poll` pipeline used by `executeBatchPayroll`: simulate first to learn the resource fee, rebuild with that fee, sign via Freighter, submit, then poll `getTransaction` for finality rather than assuming success on submit.
- **Server components for static shells; `"use client"` only where needed.** Reach for a client component only when the code touches wallet state or does async data fetching in the browser. Page shells, layout, and static content should stay server components.
- **Config flows through `getConfig()`.** Don't read `process.env.NEXT_PUBLIC_HARBOR_*` directly in a component — `getConfig()` already layers runtime overrides (Settings page) → env vars → defaults, and reading `process.env` directly bypasses the Settings-page override path.
- **Amounts are always converted, never raw.** Use `toBaseUnits` / `fromBaseUnits` any time a human-entered decimal crosses the boundary into an `i128` the contract understands. Never pass a raw string or a naively-multiplied number.
- **No new dependencies without discussing in the PR first.** The SDK surface is deliberately tiny (`@stellar/stellar-sdk`, `@stellar/freighter-api`, Next.js, React) — open the conversation in the PR description before adding a package.

---

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build       # Next.js type-checks during build
```

The app runs against the public Soroban testnet with a mock contract id out of the box, so you can develop UI changes without deploying anything. If your change touches contract calls, see [.env.local.example](.env.local.example) for pointing at a real deployment, or override values live from the **Settings** page.

There is no separate automated test suite — correctness is enforced through TypeScript's build-time checking (`npm run build`) and ESLint (`npm run lint`). Both must pass before a PR is reviewed.

---

## Submitting a PR

1. Fork the repo and create a branch: `git checkout -b feat/my-thing`.
2. Make the change, keeping the diff focused on **one** roadmap item or issue — smaller, scoped PRs are easier to review and land faster.
3. Run `npm run lint` and `npm run build` locally and fix anything they flag.
4. Open the PR with `Fixes #N` referencing the tracking issue, and a short description of what changed and why.

If you're picking up a task from `docs/ROADMAP.md`, mention which numbered item it is in the PR description — the acceptance criteria listed there is what reviewers will check against.

---

## Reviewer checklist

Contributors: it's worth self-checking this list before opening a PR, since it's exactly what review will look for.

- [ ] No Stellar SDK imports outside `src/lib/harbor.ts`
- [ ] Config flows through `getConfig()` (runtime override → env → default)
- [ ] Amounts converted with `toBaseUnits` / `fromBaseUnits`, never raw
- [ ] Errors from failed simulations/submissions surface in the UI (not just console-logged)
- [ ] New client components use `"use client"` only where wallet/async state is actually needed
- [ ] Build and lint pass

---

## Where to start

If you're not sure what to pick up, `docs/ROADMAP.md` is ordered smallest-to-largest:

| # | Task | Size |
|---|---|---|
| 1 | Point at a real deployed contract | Small |
| 2 | Contract initialization UI | Small–medium |
| 3 | Admin functions (`update_admin`, `update_treasury`, etc.) | Medium |
| 4 | Payout events API + Ledger | Medium |
| 5 | Batch size + total validation | Small |
| 6 | CSV import | Small |
| 7 | Multi-signature treasury | Large |
| 8 | Swap routing UX | Large |
| 9 | Governance / batch approval workflow | Large |

Items 1–6 are good first PRs — each is scoped to one or two files and has explicit acceptance criteria in the roadmap doc. Items 7–9 are larger design efforts worth opening a discussion issue for before writing code.

---

## Questions

Open an issue if something in the roadmap is unclear, or if you want to scope a task that isn't listed there yet before you start writing code — it's easier to align on approach early than to rework a large PR.
