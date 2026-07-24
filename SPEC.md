# Feature Spec — Chain Operations Suite (Pricing · Store Audit · Region Settlement)

> **This is the challenge.** Three interdependent modules are missing from this app.
> Your agent must implement all three. Scoring is done against a hidden test suite
> written strictly from this document — if the spec is ambiguous to you, it was
> ambiguous to everyone; the spec text is the single source of truth.

## 1. Deliverables (all three are scored)

1. **Part A — Pricing engine** (§2–§7): `src/pricing/engine.ts` exporting

   ```ts
   export function priceTicket(input: PriceTicketInput): PricedTicket
   ```

2. **Part B — Store audit** (§10): `src/audit/storeAudit.ts` exporting

   ```ts
   export function auditStores(asOf: string): StoreAudit[]
   ```

3. **Part C — Region settlement** (§11): `src/settlement/settle.ts` exporting

   ```ts
   export function settleRegion(input: SettleRegionInput): RegionSettlement
   ```

   Part C **must** import and reuse `priceTicket` from `../pricing/engine` — it is
   judged against *your* pricing module, so the parts must agree.

All modules read data via the loaders in `src/data/index.ts` (`getMenu`, `getMembers`,
`getOffers`, `getStores`, `getRegions`, `getTickets`, `getMenuItem`, `getMember`,
`getStore`, `getRegion`). Do not re-read the JSON files directly. (The New-Ticket
screen UI wiring described in §8 is **not scored** — skip it unless you have time to
spare.)

## 2. Types

```ts
export interface CartLine { productId: string; qty: number }        // qty ≥ 1, integer

export interface PriceTicketInput {
  lines: CartLine[]
  memberId: string | null      // null = walk-in / non-member
  date: string                 // ISO date, e.g. "2026-07-15" — the pricing date
}

export interface PricedLine {
  productId: string
  qty: number
  unitPrice: number            // from menu.basePrice
  gross: number                // unitPrice * qty, rounded (§6)
  appliedOfferId: string | null
  discount: number             // ≥ 0, rounded (§6)
  net: number                  // gross - discount (never below 0)
}

export interface PricedTicket {
  lines: PricedLine[]
  orderLevel: { appliedOfferId: string | null; discount: number }
  subtotal: number             // sum of line nets
  total: number                // subtotal - orderLevel.discount, floored at 0
}
```

Menu, members and offers are loaded from `src/data/menu.json`, `src/data/members.json`,
`src/data/offers.json`. The engine must read them via the existing typed loaders in
`src/data/index.ts` (do not fetch).

## 3. Offer types

Offers live in `src/data/offers.json`. Three `type` values exist:

### 3.1 `percent_off` (line-level)
```json
{ "type": "percent_off", "percent": 15, "scope": { "category": "espresso" } }
```
- `scope` has **either** `category` **or** `productIds` (array). The offer applies to a
  cart line if the line's product matches the scope.
- Line discount = `gross * percent / 100`, rounded per §6.

### 3.2 `bundle` (line-level, two-product)
```json
{ "type": "bundle", "products": ["m-latte-12", "m-croissant"], "amountOff": 1.50 }
```
- `products` is an array of **exactly two distinct product ids**: `[buyProductId, getProductId]`.
- The offer discounts the line whose `productId === products[0]` (the "buy" line).
  The line matching `products[1]` (the "get" line) is a **requirement** — it must be
  present in the cart at qty ≥ 1 — but is not itself discounted by this offer.
- Number of complete bundle pairs = `min(qty of products[0], qty of products[1])`
  in the cart.
- Line discount attributed to the buy line = `pairs * amountOff`, rounded per §6.
- If the get line is absent from the cart, `pairs = 0` → the offer matches the buy
  line but yields **discount 0**, which counts as **not applicable** for selection (§5).
- The discount is clamped so the buy line's `net` never goes below 0 (see §6);
  the clamped value is what §5's best-for-customer comparison uses.

### 3.3 `spend_threshold` (order-level)
```json
{ "type": "spend_threshold", "category": "bakery", "minSubtotal": 15, "amountOff": 2 }
```
- Evaluated **after** all line-level offers are applied.
- `category` is **optional**. When present, qualification uses the sum of **line nets**
  (post line-discount) for products in that `category`. When absent, qualification
  uses the **order subtotal** (§2, sum of all line nets).
- Qualifies when the relevant amount is **≥ `minSubtotal`** (inclusive).
- Order-level discount = `amountOff` (a fixed currency amount).

## 4. Validity & eligibility (all offer types)

- Every offer has `validFrom` and `validTo` (ISO dates). An offer is date-active
  when `validFrom ≤ date ≤ validTo` — **both endpoints inclusive**. Compare dates as
  calendar dates; there is no time-of-day component.
- An offer may have `dayOfWeek` (array of three-letter weekday abbreviations from
  `Sun|Mon|Tue|Wed|Thu|Fri|Sat`). If present, the offer is only active on those
  weekdays. Compute the weekday from the ISO date interpreted as **UTC**:
  ```ts
  const [y, m, d] = date.split('-').map(Number)
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay()  // 0=Sun … 6=Sat
  ```
  If `dayOfWeek` is absent, the offer applies on every weekday.
- An offer may have `eligibleTiers` (array of member tiers, e.g. `["silver","gold"]`).
  If present, the ordering ticket **must** have a member whose `tier` is in the list —
  a walk-in (`memberId === null`) is **never** eligible for these offers.
  If `eligibleTiers` is absent, both members of every tier **and walk-ins** are eligible.
- Inactive or ineligible offers are ignored entirely.
- **Loyalty tier alone does not grant any automatic discount.** Tier only affects
  offer *eligibility*. There is no built-in "gold gets 10% off" — that behaviour
  exists only in the legacy files under `src/legacy/` and must not be replicated.

## 5. Stacking & selection rules

1. **At most one line-level offer per cart line.** If several active, eligible
   line-level offers apply to the same line, choose the one with the **largest
   clamped discount** for that line ("best for customer").
2. **Tie-break** (equal discounts): earlier `validFrom` wins; if still tied, the
   offer whose `id` sorts first lexicographically wins.
3. An offer whose computed (clamped) discount for a line is **0** is not applicable
   to that line (see bundle without get line, §3.2).
4. **At most one order-level offer per order.** If several `spend_threshold` offers
   qualify, choose the one with the largest `amountOff`; tie-break as in rule 2.
5. Line-level and order-level offers **do stack** with each other (a line offer plus
   an order offer on the same ticket is normal).
6. The same offer may be applied to multiple different lines if its scope matches
   them (a `percent_off` on a category can discount every line in that category).
7. **No cumulative stacking of offers on a single line.** If offer A and offer B both
   match a line, only the winner of the best-for-customer comparison is applied to
   that line — never both, never one on top of the other.

## 6. Rounding & money

- **Every** money value in the output is rounded to **2 decimal places, half-up** —
  `gross`, `discount`, `net`, `subtotal`, `total`, and the order-level discount.
  Half-up means `1.005 → 1.01`; and beware float artifacts: `2.175` is stored as
  `2.17499…`, so a naive `Math.round(x*100)/100` gives `2.17` when the spec requires `2.18`.
- **Banker's rounding is not accepted.** The legacy engine in `src/legacy/` uses it.
  Your new engine must not.
- Round each line's `gross` and `discount` independently, then
  `net = round2(gross − discount)`, clamped at 0. (A raw subtraction of two rounded
  operands can still leave `18.669999…`; the output must be `18.67` — round it.)
- `subtotal = round2(sum of line nets)`. `total = round2(subtotal − orderLevel.discount)`,
  clamped at 0.

## 7. Edge cases the engine must handle

- Empty `lines` → valid result: no lines, subtotal 0, total 0, no offers applied.
- Unknown `productId` in a cart line → throw `Error("Unknown product: <id>")`.
- `memberId` non-null but unknown → throw `Error("Unknown member: <id>")`.
- `memberId === null` is valid (walk-in ticket).
- `qty` ≤ 0 or non-integer → throw `Error("Invalid qty for <productId>")`.
- A `spend_threshold` offer may push `total` toward 0 but never negative.
- A bundle whose buy-line discount would exceed the buy line's `gross` is clamped
  at `gross` (line net 0). Selection in §5 uses the clamped amount.

## 8. UI acceptance (New-Ticket screen) — not scored

- Adding items to the cart recalculates pricing live (on every cart change).
- Each line shows the applied offer **name** (not id) or "—".
- The summary block has `data-testid` hooks: `ticket-subtotal`, `ticket-discount`,
  `ticket-total` (text content = formatted number with 2 decimals, no currency symbol).
- The submit button (`data-testid="submit-ticket"`) is disabled when the cart is empty.

## 9. Scoring — hidden tests, judged at the end

**This repo ships with no tests.** Your agent builds all three modules from this document
and must not write or run tests. At judging time a hidden suite — written strictly from
this spec, covering every rule and edge case in Parts A, B, and C — is run against your
modules to score correctness. Part C is exercised through *your* `priceTicket`, so pricing
mistakes surface in settlement too. This document is the entire surface: read it carefully.

---

## 10. Part B — Store Audit (`src/audit/storeAudit.ts`)

District managers need a health readout per store, computed from the ticket log.

### 10.1 Signature & types

```ts
export interface StoreAudit {
  storeId: string
  weightedScore: number | null            // §10.3, rounded per §6; null if no counted tickets
  trend: 'up' | 'down' | 'flat' | null    // §10.4; null if fewer than 2 counted tickets
  daysSinceLastTicket: number | null      // §10.5; null if no counted tickets
  dormant: boolean                        // §10.5
  status: 'thriving' | 'attention' | 'critical' | 'inactive'   // §10.6
}

export function auditStores(asOf: string): StoreAudit[]
```

- `asOf` must match `YYYY-MM-DD`; otherwise throw `Error("Invalid date: <asOf>")`.
- Returns **one entry per store** in `stores.json`, sorted by `storeId` ascending.

### 10.2 Counted tickets

For each store, count only tickets with `date ≤ asOf` (inclusive; compare ISO strings).
Order counted tickets **most recent first**: `date` descending, ties broken by `id`
descending. ("Latest" below always means the first ticket in this order.)

### 10.3 Weighted score

Take up to the **4 most recent** counted tickets with weights **4, 3, 2, 1** (most recent
gets 4). `weightedScore = round2( Σ(weightᵢ × csatᵢ) / Σ(weightᵢ) )` using §6 half-up
rounding. Divisors:

| Tickets used | Weights used | Divisor |
|---|---|---|
| 4 | 4, 3, 2, 1 | 10 |
| 3 | 4, 3, 2    | 9  |
| 2 | 4, 3       | 7  |
| 1 | 4          | 4  |

With 0 counted tickets `weightedScore` is `null`.

### 10.4 Trend

Requires at least 2 counted tickets. Let `s₁` be the latest ticket's `csat` (an integer
1–5). Let `prevMean` be the arithmetic mean of the `csat` values of the **next up to
three** tickets in the most-recent-first order (ticket 2, and optionally 3 and 4),
rounded per §6.

- `'up'` if `s₁ > prevMean`
- `'down'` if `s₁ < prevMean`
- `'flat'` if `s₁ === prevMean` (comparison is on the rounded `prevMean`)

With fewer than 2 counted tickets, `trend` is `null`.

### 10.5 Recency

`daysSinceLastTicket` = whole calendar days from the latest counted ticket's `date`
to `asOf` (date-only arithmetic; same day → 0). `null` if no counted tickets.
`dormant` = `true` when `daysSinceLastTicket` is `null` **or** strictly greater than
**21**. (Exactly 21 days is *not* dormant.)

### 10.6 Status

- `'inactive'` — no counted tickets.
- `'critical'` — `weightedScore < 3.0`.
- `'attention'` — `3.0 ≤ weightedScore < 4.0`.
- `'thriving'` — `weightedScore ≥ 4.0`.

Boundaries are decided on the **rounded** `weightedScore` (exactly 3.0 → attention;
exactly 4.0 → thriving). The `dormant` boolean is **independent** of `status`.

---

## 11. Part C — Region Settlement (`src/settlement/settle.ts`)

End-of-day: given the tickets captured across a region's stores, produce the region's
settlement.

### 11.1 Signature & types

```ts
export interface SettleRegionInput {
  regionId: string
  date: string                    // pricing date, passed through to priceTicket
  tickets: Array<{
    storeId: string
    memberId: string | null
    lines: CartLine[]
  }>
}

export interface RegionSettlement {
  regionId: string
  date: string
  grossTotal: number              // §11.3
  lineDiscountTotal: number
  orderDiscountTotal: number
  discountTotal: number
  netTotal: number
  perCategory: Record<string, number>   // §11.4
  offerUsage: Record<string, number>    // §11.5
  bonus: number                   // §11.6
  storesVisited: string[]         // §11.7
  storesMissed: string[]
}

export function settleRegion(input: SettleRegionInput): RegionSettlement
```

### 11.2 Validation & pricing

- Unknown `regionId` (via `getRegions()`) → throw `Error("Unknown region: <regionId>")`.
- Every ticket's `storeId` must be one of the region's stores; otherwise throw
  `Error("Store not in region: <storeId>")`. Multiple tickets for the same store are
  allowed. An empty `tickets` array is valid.
- Price **each ticket** by calling `priceTicket({ lines, memberId, date })` from
  `../pricing/engine`. All of §11.3–§11.6 aggregate over those results. Any error
  thrown by `priceTicket` propagates unchanged.

### 11.3 Money totals (all rounded per §6, half-up 2dp)

- `grossTotal` = round2( sum of every priced line's `gross` ).
- `lineDiscountTotal` = round2( sum of every priced line's `discount` ).
- `orderDiscountTotal` = round2( sum of every ticket's `orderLevel.discount` ).
- `discountTotal` = round2( lineDiscountTotal + orderDiscountTotal ).
- `netTotal` = round2( sum of every ticket's `total` ).

### 11.4 Per-category nets

`perCategory` maps each menu category that appears in the tickets to
`round2( sum of its lines' net )`. Categories with no lines are **absent** (not 0).
**Order-level discounts are NOT allocated to categories.** Keys sorted ascending.

### 11.5 Offer usage

`offerUsage` counts applications: each priced **line** with `appliedOfferId` adds 1 to
that offer; each ticket's `orderLevel.appliedOfferId` (when non-null) adds 1. Offers
never applied are absent. Keys sorted ascending.

### 11.6 Bonus — marginal tiers on `netTotal`

The shift bonus is **marginal** (like tax brackets), computed on `netTotal`, rounded
per §6 only at the end:

| Tier | Portion of netTotal | Rate |
|---|---|---|
| 1 | first 250.00 | 3% |
| 2 | over 250.00 up to 750.00 | 6% |
| 3 | over 750.00 | 10% |

Example: `netTotal` 400.00 → 250×3% + 150×6% = 7.50 + 9.00 = 16.50 → **16.50**.
Example: `netTotal` 1000.00 → 250×3% + 500×6% + 250×10% = 7.50 + 30.00 + 25.00 = 62.50 → **62.50**.
Example: `netTotal` 316.86 → 250×3% + 66.86×6% = 7.50 + 4.0116 = 11.5116 → **11.51**.
(A flat single-rate reading is wrong.)

### 11.7 Stores

- `storesVisited` = the region's stop `storeId`s that have **≥ 1 ticket**, in **region
  order**, no duplicates (even if a store appears twice as a stop, list it once,
  at its first position in the region).
- `storesMissed` = the remaining stop storeIds, in region order, also deduplicated.
