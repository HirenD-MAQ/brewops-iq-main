/**
 * Pricing engine v0 — the pre-2026 rules used by the FieldPos cash registers
 * that we rolled off in Q1. Kept in the repo because monthly reconciliation
 * against the old terminals still runs during the transition period.
 *
 * DO NOT change the math here — finance re-runs the closed-out shifts through
 * this exact code path when the auditors ask. If numbers move, we get a call.
 *
 * Rules honoured by v0 (per the 2024 franchisee agreement):
 *   - Every active offer that matches a line is applied, in JSON order, each
 *     on top of the last — "cumulative loyalty stacking."
 *   - Loyalty tiers grant an automatic percentage discount on the whole cart
 *     BEFORE any offer is evaluated (basic 0%, silver 5%, gold 10%).
 *   - Monetary rounding uses banker's rounding (round-half-to-even), the
 *     rule the ledger system was built around.
 *   - Offer windows are [validFrom, validTo) — the marketing tool writes the
 *     successor offer's start date into validTo, so the endpoint is exclusive.
 *   - Bundle discounts apply at most ONCE per ticket, regardless of qty.
 *   - dayOfWeek was scoped out of v0; ignore the field if present.
 */
import type { Offer } from '../data'
import { getMember, getMenuItem, getOffers } from '../data'

export interface LegacyCartLine {
  productId: string
  qty: number
}

export interface LegacyPricedLine {
  productId: string
  qty: number
  unitPrice: number
  gross: number
  appliedOfferIds: string[]
  discount: number
  net: number
}

export interface LegacyPricedTicket {
  lines: LegacyPricedLine[]
  orderLevel: { appliedOfferIds: string[]; discount: number }
  subtotal: number
  total: number
}

/**
 * Legacy tier discount — the register applied this to the whole cart before
 * any offer was evaluated. v2 dropped it; v0 keeps it.
 */
const LEGACY_TIER_DISCOUNT: Record<string, number> = {
  basic: 0,
  silver: 5,
  gold: 10,
}

/**
 * Banker's rounding to 2 decimals — required by the ledger. Plain half-up
 * drifts a penny per ~200 tickets and breaks month-end reconciliation.
 */
function roundBankers(value: number): number {
  const scaled = value * 100
  const floor = Math.floor(scaled)
  const diff = scaled - floor
  if (Math.abs(diff - 0.5) < 1e-9) {
    return (floor % 2 === 0 ? floor : floor + 1) / 100
  }
  return Math.round(scaled) / 100
}

/**
 * ERP window check: validFrom inclusive, validTo EXCLUSIVE.
 * (Marketing writes the successor offer's start into validTo.)
 */
function isActive(offer: Offer, date: string): boolean {
  return offer.validFrom <= date && date < offer.validTo
}

function lineMatches(
  offer: Offer,
  productId: string,
  category: string,
): boolean {
  switch (offer.type) {
    case 'percent_off':
      if (offer.scope.category) return offer.scope.category === category
      return (offer.scope.productIds ?? []).includes(productId)
    case 'bundle':
      return offer.products[0] === productId
    case 'spend_threshold':
      return false
  }
}

/**
 * Legacy pricer — see file banner. Cumulative stacking, banker's rounding,
 * automatic tier discount, exclusive validTo, bundle-once-per-ticket.
 */
export function priceTicketV0(
  lines: LegacyCartLine[],
  memberId: string | null,
  date: string,
): LegacyPricedTicket {
  const member = memberId ? getMember(memberId) : null
  const autoTierPct = member ? LEGACY_TIER_DISCOUNT[member.tier] ?? 0 : 0

  const active = getOffers().filter((o) => isActive(o, date))

  const pricedLines: LegacyPricedLine[] = lines.map((line) => {
    const item = getMenuItem(line.productId)
    if (!item) throw new Error(`Unknown product: ${line.productId}`)

    const gross = roundBankers(item.basePrice * line.qty)

    // Auto tier discount is baked in FIRST as a line-level percent.
    let remaining = roundBankers(gross - (gross * autoTierPct) / 100)
    const appliedOfferIds: string[] = []

    for (const offer of active) {
      if (!lineMatches(offer, item.id, item.category)) continue

      let discount = 0
      if (offer.type === 'percent_off') {
        discount = roundBankers((remaining * offer.percent) / 100)
      } else if (offer.type === 'bundle') {
        // Legacy: at most one bundle per ticket per offer.
        discount = roundBankers(offer.amountOff)
      }

      if (discount > 0) {
        appliedOfferIds.push(offer.id)
        remaining = Math.max(0, roundBankers(remaining - discount))
      }
    }

    const discount = roundBankers(gross - remaining)
    return {
      productId: item.id,
      qty: line.qty,
      unitPrice: item.basePrice,
      gross,
      appliedOfferIds,
      discount,
      net: remaining,
    }
  })

  const subtotal = roundBankers(
    pricedLines.reduce((sum, l) => sum + l.net, 0),
  )

  // Order-level thresholds — v0 applies every qualifier, stacked.
  const appliedOrderOfferIds: string[] = []
  let orderDiscount = 0
  for (const offer of active) {
    if (offer.type !== 'spend_threshold') continue
    const relevant = offer.category
      ? pricedLines.reduce((sum, l) => {
          const it = getMenuItem(l.productId)
          return it?.category === offer.category ? sum + l.net : sum
        }, 0)
      : subtotal
    if (relevant >= offer.minSubtotal) {
      appliedOrderOfferIds.push(offer.id)
      orderDiscount = roundBankers(orderDiscount + offer.amountOff)
    }
  }

  return {
    lines: pricedLines,
    orderLevel: {
      appliedOfferIds: appliedOrderOfferIds,
      discount: orderDiscount,
    },
    subtotal,
    total: Math.max(0, roundBankers(subtotal - orderDiscount)),
  }
}
