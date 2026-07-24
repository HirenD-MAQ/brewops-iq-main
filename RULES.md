# BrewOps IQ — Harness Hackathon

## The challenge
Three interdependent modules are missing from this app — the **Chain Operations Suite**
specified in `SPEC.md`:

- **Part A — Pricing engine** (`src/pricing/engine.ts`, `priceTicket`)
- **Part B — Store audit** (`src/audit/storeAudit.ts`, `auditStores`)
- **Part C — Region settlement** (`src/settlement/settle.ts`, `settleRegion` — must reuse
  your `priceTicket`, so the parts have to agree)

Your job is to get an AI agent to build **all three, correctly, for the fewest AI
credits.** This is too big to one-shot reliably — the winners will be the people who
**engineer the best harness** around the agent.

## What "harness" means here (all of it is fair game)
- `.github/copilot-instructions.md` and `AGENTS.md` — standing instructions the agent
  always reads: what to read, what to ignore, the traps to avoid.
- **Distilled specs / briefs / plan files** you write into the repo — so the agent
  doesn't re-read the whole SPEC every run.
- **Skills** (`copilot skill`) — modular context loaded on demand.
- **Staged runs** — the run prompt is fixed, but you steer by *editing your harness
  files between runs* ("pricing is done — build only the audit module this run").
  Three focused runs often beat one mega-run that fails and retries.
- **Model choice per run** (`--model`) — the biggest cost lever. Advanced: per-subagent
  model config in the Copilot CLI.

**You build the harness; the agent writes the code.** You may not hand-write or
hand-edit anything under `src/`. The agent may not write or run tests, and never
scores itself — there is no test suite in this repo.

## Scoring
1. **Gate — "it works":** your modules must pass **100% of the core hidden tests**
   (written strictly from `SPEC.md`, across all three parts) to qualify.
2. **Champion (the prize): lowest total credit cost** among everyone who clears the gate.
3. **Tie-breaks:** most bonus edge-case tests passed, then earliest to reach the gate.

## Submitting (fork model)
1. **Fork** this repo (top-right on GitHub) — that's your copy; no invite needed.
2. Run the agent with the provided wrapper — `node agent-run.mjs --model <yours>` — it
   builds against your harness **and writes your cumulative cost to `COST.txt`
   automatically.** Run it as many times as your strategy needs; every run adds cost.
3. Commit your `src/pricing`, `src/audit`, `src/settlement` files + `COST.txt` and
   **push to your fork.** Re-push anytime before pencils-down — the judge auto-discovers
   every fork at each checkpoint.

## Rules
1. **Scored deliverables = the three module entry points** named above. The New-Ticket
   screen UI wiring in SPEC §8 is **not scored** — skip it.
2. **All spend counts** — exploration, failed runs, everything. Under-reporting
   `COST.txt` is a DQ; top scorers screen-share their credit total before prizes.
3. **The agent must not write or run tests**, and must not score itself.
4. **Copying another fork's solution = DQ.** The judge flags identical solutions. Your
   harness files can stay local — only `src/**` modules + `COST.txt` need pushing.
5. **Frozen files** — don't edit `src/data/*.json`; the judge resets them to canonical
   before scoring.
6. **No test-suite fishing.** The hidden suite isn't in the repo and won't be discussed.
   It's written from `SPEC.md` — which you have. Read the spec carefully instead.
7. **Pencils down** = your last push before the final checkpoint.

## Strategy hints (this is the point)
- Three modules, one fixed prompt: **decomposition is yours to engineer.** Scope each
  run via your instruction files; keep a progress note in the repo so the next run
  doesn't re-discover what's done.
- **Cheap comes from less context**: a distilled brief per module beats re-reading the
  full spec every run. More instructions is not always better — an overloaded harness
  confuses cheaper models.
- The parts must **agree**: settlement is judged through *your* pricing engine.
  A pricing bug can fail settlement tests too.
- A big model brute-forces; a cheap model + a great harness wins on cost. Find the
  cheapest model your harness can carry through the gate.
- Some files in this repo are old and wrong. `SPEC.md` is the only source of truth.
  Look at `src/legacy/*` and `docs/RETRO.md` — those are traps you have to steer
  around.
