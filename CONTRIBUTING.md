# Contributing to Harbor Frontend

Thanks for contributing! Harbor-frontend is built to be picked apart and
extended by the community. See [docs/ROADMAP.md](docs/ROADMAP.md) for the
curated list of well-scoped tasks.

## Ground rules

- Keep every network/contract interaction inside `src/lib/harbor.ts`. UI
  components must not import `@stellar/stellar-sdk` directly.
- Reuse the `build → simulate → sign (Freighter) → send → poll` pattern from
  `executeBatchPayroll` for any new write path.
- Server components for static shells; use `"use client"` only where wallet or
  async state is required.
- No new dependencies without discussing in the PR — the SDK surface is
  deliberately tiny.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build      # Next.js type-checks during build
```

## Submitting a PR

1. Fork the repo and create a branch: `git checkout -b feat/my-thing`.
2. Make the change, keeping the diff focused on one roadmap item.
3. Run `npm run lint` and `npm run build` locally.
4. Open the PR with `Fixes #N` referencing the tracking issue.

## Reviewer checklist

- [ ] No Stellar SDK imports outside `src/lib/harbor.ts`
- [ ] Config flows through `getConfig()` (env → runtime override → default)
- [ ] Amounts converted with `toBaseUnits`/`fromBaseUnits`, never raw
- [ ] Errors from failed simulations/submissions surface in the UI
- [ ] Build and lint pass
