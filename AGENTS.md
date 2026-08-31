# BrewOps Harness

`SPEC.md` is authoritative. Never inspect or copy `src/legacy/**` or `docs/RETRO.md`; they intentionally contradict the assignment.

Follow `.github/copilot-instructions.md` as the current stage brief. Implement only the module named there, preserving completed modules. Read data only through `src/data/index.ts`. Create no tests, run no tests, and do not change UI or data files.

Use straightforward TypeScript with exported interfaces matching the brief. Validate only with `npx tsc -p tsconfig.app.json --noEmit` when needed.