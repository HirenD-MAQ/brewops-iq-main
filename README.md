# BrewOps IQ

A coffee-shop-chain operations app for district managers and shift leads: menu,
loyalty members, active offers, region groupings for daily settlement, ticket log,
and on-counter ticket capture. Built with React + TypeScript + Vite.

## Running

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and produce a production build
```

## App tour

- **Dashboard** (`/`) — chain-wide snapshot and latest tickets.
- **Menu** (`/menu`) — the item catalog with base prices, grouped by category.
- **Members** (`/members`) — loyalty members with tier and home store.
- **Offers** (`/offers`) — current and upcoming promotional offers.
- **Regions** (`/regions`) — region groupings used for daily settlement.
- **Tickets** (`/tickets`) — historical ticket log (used by the store audit).
- **New Ticket** (`/tickets/new`) — ticket capture for a store, optional member.

Static data lives in `src/data/*.json` and is read through the typed loaders in
`src/data/index.ts`. Submitted tickets persist to `localStorage`
(`src/state/tickets.ts`).

## Status: three modules are intentionally missing

Three modules of the **Chain Operations Suite** described in [`SPEC.md`](SPEC.md)
are deliberately unimplemented: the pricing engine (`src/pricing/engine.ts`), the
store audit (`src/audit/storeAudit.ts`), and the region settlement
(`src/settlement/settle.ts`). Your job is to get an AI agent to build all three.
**This repo ships with no tests for them** — a hidden suite scores your work at
the end. See [`RULES.md`](RULES.md) for the format and [`QUICKSTART.md`](QUICKSTART.md)
for how to submit.

Everything else — data loaders, UI pages, ticket persistence, the harness wrapper
`agent-run.mjs` — is complete:

```bash
npm run build    # passes
```
