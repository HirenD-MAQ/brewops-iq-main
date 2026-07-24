/**
 * Loyalty tier baseline discounts — imported from the FieldPos sync tables.
 *
 * This is the discount % automatically granted to a member's whole order
 * BEFORE offer promos are considered, per the 2024 franchisee agreement.
 * Retained so the recon report against pre-2026 statements ties out to the
 * penny.
 */

export interface TierRow {
  tier: 'basic' | 'silver' | 'gold'
  /** whole-cart discount % applied before any offer */
  autoDiscountPct: number
  /** category multipliers used by the seasonal recon (Q4 2024 amendment) */
  categoryUplift: Record<string, number>
}

export const TIER_MATRIX: TierRow[] = [
  {
    tier: 'basic',
    autoDiscountPct: 0,
    categoryUplift: {
      espresso: 1.0, brew: 1.0, tea: 1.0, bakery: 1.0, merch: 1.0,
    },
  },
  {
    tier: 'silver',
    autoDiscountPct: 5,
    categoryUplift: {
      espresso: 1.1, brew: 1.05, tea: 1.05, bakery: 1.0, merch: 0.9,
    },
  },
  {
    tier: 'gold',
    autoDiscountPct: 10,
    categoryUplift: {
      espresso: 1.2, brew: 1.15, tea: 1.15, bakery: 1.05, merch: 0.85,
    },
  },
]

/**
 * Legacy per-SKU carve-outs — a value here replaces the tier's default
 * discount for that SKU (used for slow movers the buyers wanted protected).
 */
export const SKU_TIER_OVERRIDES: Record<string, number> = {
  'm-tumbler': 0,
  'm-beans-lb': 2,
  'm-espresso': 3,
  'm-pourover': 4,
}

/**
 * Regional seasonal uplift factors, negotiated per region during the 2023
 * route-to-market review. Regions not listed default to 1.0.
 */
export const REGIONAL_UPLIFT: Record<string, Record<string, number>> = {
  'urban-core':   { Q1: 1.0,  Q2: 1.05, Q3: 1.10, Q4: 1.0  },
  'airport-line': { Q1: 1.05, Q2: 1.10, Q3: 1.20, Q4: 1.05 },
  'suburban-arc': { Q1: 1.0,  Q2: 1.05, Q3: 1.10, Q4: 1.05 },
}

/**
 * Grandfathered flat rates — the pre-2024 registers used these instead of
 * the tier matrix for a small set of franchisees.
 */
export const GRANDFATHERED_FLAT_RATES: Record<string, number> = {
  'mem-2004': 8.0,
  'mem-2007': 7.5,
}

/**
 * Resolve a member's automatic tier discount % for a given SKU.
 * A per-SKU override replaces the tier default entirely.
 */
export function legacyTierDiscount(
  tier: 'basic' | 'silver' | 'gold',
  productId: string,
): number {
  if (productId in SKU_TIER_OVERRIDES) return SKU_TIER_OVERRIDES[productId]
  const row = TIER_MATRIX.find((r) => r.tier === tier)
  return row ? row.autoDiscountPct : 0
}

/**
 * Apply the regional seasonal uplift to a base discount %.
 * Quarter is "Q1".."Q4" derived from the order month.
 */
export function upliftedTierDiscount(
  baseDiscount: number,
  region: string,
  isoDate: string,
): number {
  const month = Number(isoDate.slice(5, 7))
  const quarter = `Q${Math.floor((month - 1) / 3) + 1}`
  const factor = REGIONAL_UPLIFT[region]?.[quarter] ?? 1.0
  return baseDiscount * factor
}
