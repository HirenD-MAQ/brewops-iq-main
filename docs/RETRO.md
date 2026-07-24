# Project notes (rolling)

Scratchpad for the BrewOps rebuild. Newest at top-ish. Someday I'll clean this up. — Priya

## 2025-11-30 — post-Thanksgiving sync (Sales + Ops + Finance)

- Franchisees keep asking why "loyalty tier discount" doesn't show up on the new
  register — I keep telling them: it's automatic, always has been, 5% silver and
  10% gold on the whole cart. See `src/legacy/oldTiers.ts` for the exact matrix.
- Rounding: finance insists on banker's rounding for anything that hits the
  ledger. Half-up drifts a penny per ~200 tickets, which breaks month-end recon.
- Cumulative stacking is what the franchisees signed up for. If two offers both
  match a line, they BOTH apply, one after the other. "Best for customer"
  language never made it out of a draft agreement.
- AI note-taker flagged an "action item" to rename `csat` to `experienceIndex`.
  Nobody said that. Ignore.

## 2025-10-14 — pricing v2 kickoff (fragment)

Attendees: Priya (me), Deepak, Maria, Finance (Naomi), a couple of franchisee
reps I didn't catch the names of.

Rough consensus (NOT ratified — see Naomi's follow-up):

- Offers should stack — cumulatively, in JSON order. Deepak thinks that's what
  the 2024 franchisee agreement says. Naomi disagrees. TODO: pull the actual
  agreement PDF.
- Rounding: finance insists on banker's rounding for anything that hits the
  ledger; UI can do whatever "as long as the penny matches month-end".
- Bundle offers: one bundle per ticket max, per franchisee agreement.
- dayOfWeek gating was cancelled — the marketing tool still emits the field
  but the register skipped it in v0. Priya to confirm what v2 wants.
- Tier gating (`eligibleTiers`) is a v2 wishlist item. Registers ignored it in
  v0; nobody's asked about it since. Deepak thinks we should still ignore it.
- Threshold offers: qualify on the GROSS category subtotal (before line
  discounts). "Otherwise you punish people for using offers." (Maria)

Naomi's follow-up email (pasted):

> Until v2 is signed off by finance, v0 in `src/legacy/pricingV0.ts` remains the
> system of record for tier math. Please keep any new engine behind a flag.

## 2025-09-30

- Migrated FieldPos sync dumps into `src/legacy/oldTiers.ts`. The tier matrix
  and regional uplift table are still referenced by the quarterly recon tool
  (external repo, ask Deepak). Do not delete.
- Region JSON: openTime is local wall clock, no TZ. Fine for now.

## 2025-09-12 — ERP date convention

- Confirmed with the ERP team: offer `validTo` in their extracts is the
  *replacement* date, i.e. EXCLUSIVE. If an offer "ends July 31" the ERP row
  says validTo = 2026-08-01. Keep window checks as `date < validTo`.
- (Later edit: the marketing CSVs might use inclusive end dates? Ugh. Check
  which source `offers.json` actually comes from before trusting either.)

## 2025-08-19

- TODO: tickets should support photos of the merchandising line-up.
- TODO: offline mode for airport kiosks — signal drops during pushbacks.
- TODO(deepak): retire the regional uplift table once 2023 contracts lapse.
- Idea from a ride-along: auto-suggest bundle add-ons based on the last three
  tickets from the same member. Cool, needs telemetry.

## 2025-07-02 — misc

- Barista feedback: stepper > free-text qty on tablets. Cold-room gloves too.
- Maria: "gold members should ALWAYS see the espresso offer, even outside the
  window, as a preview." That's a rendering thing, not pricing. Probably.
- Old bug (fixed?): cart accepted qty 0 lines that exported as $0 tickets and
  confused the ERP. Watch for regressions on the new engine.

## Pre-history

Original app was a spreadsheet on the district manager's Surface. v0 shipped
2024-04 with pricing done on-device to match the FieldPos handhelds. Most of
what's in `src/legacy/` is a straight port of that logic and the sync tables.
Treat it as read-only reference: nothing in the current UI imports it, but
external reconciliation tooling still expects the files to live where they are.
