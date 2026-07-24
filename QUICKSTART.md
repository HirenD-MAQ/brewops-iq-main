# Quickstart — how to compete (5-minute read)

Goal: get an AI agent to build the **three missing modules** in `SPEC.md` — pricing
(`priceTicket`), store audit (`auditStores`), region settlement (`settleRegion`) —
**correctly and for the fewest AI credits.** You build the *harness*; the agent builds
the code. See `RULES.md` for the full rules, or open `guide.html` for the visual version.

## 0. One-time setup — do this BEFORE the session
- **Node 20+** — check with `node --version`.
- **Install the Copilot CLI:** `npm install -g @github/copilot`
- **Verify:** `copilot -p "hello"` should print an `AI Credits …` line at the end.
  If it doesn't, ping the facilitator before the session.

## 1. Fork & clone
Fork this repo on GitHub (top-right button), then:
```bash
git clone https://github.com/<you>/brewops-iq
cd brewops-iq
npm install
```

## 2. Build your harness (this is the competition)
Everything the agent reads is yours to engineer:
- `.github/copilot-instructions.md` / `AGENTS.md` — what to read, what to ignore, the traps.
- Distilled per-module briefs or a plan file — so runs don't re-read the whole spec.
- Skills (`copilot skill`) if you want modular, on-demand context.
- A progress note you update between runs ("A done, B done, C next").

**`SPEC.md` is the only source of truth; not everything else in this repo is reliable.**
Specifically: everything under `src/legacy/` and `docs/RETRO.md` describes the *old*
register software. Its rounding, offer stacking, tier logic and date semantics all
contradict `SPEC.md`. Your harness has to steer your agent around them.

## 3. Run the agent — it auto-records your cost
```bash
node agent-run.mjs --model <your-model>
```
The prompt is fixed (see RULES) — **you steer by editing your harness files between
runs**, e.g. scope this run to one module. Each run adds its exact credits to
`COST.txt` and prints `compiles: ✓/✗`. Model choice is your biggest cost lever
(`copilot` → `/model` shows your options).

## 4. Submit (and resubmit to climb)
```bash
git add src COST.txt
git commit -m submission
git push
```
The judge auto-discovers your fork at each checkpoint and posts your score + cost on
the live board (you won't see *which* tests failed — reason from the spec). Refine,
re-run, push again. **Pencils down = your last push.**

## Scoring
- **Gate:** 100% of the core hidden tests, across all three modules.
- **Champion:** lowest total AI-credit cost among those who qualify. Ties → most bonus
  tests, then earliest to qualify.
