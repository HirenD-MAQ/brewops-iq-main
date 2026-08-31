# BrewOps Harness Plan

## Problem

Implement the three missing Chain Operations Suite modules from `SPEC.md`: ticket pricing, per-store health audit, and region settlement. The modules must agree on pricing behavior, avoid the intentionally contradictory legacy implementation, pass hidden spec-derived checks, and be produced through `agent-run.mjs` without creating or running tests.

## Approach

Use `AGENTS.md` for permanent guardrails and `.github/copilot-instructions.md` as a mutable stage brief. Each agent run receives only one module's distilled contract, preserves completed modules, reads static data through `src/data/index.ts`, and validates with TypeScript compilation. Review each generated module against `SPEC.md` before advancing the stage.

## Progress

- Pricing: complete; reviewed and corrected for full order-level discount semantics.
- Store audit: complete; reviewed against ordering, weighting, trend, recency, and status rules.
- Region settlement: complete; reviewed for pricing reuse, aggregation, marginal bonus, and store ordering.
- Cumulative wrapper cost is recorded in `COST.txt`.