import { getMenuItem, getRegion } from '../data'
import { priceTicket, type CartLine } from '../pricing/engine'

export interface SettleRegionInput {
  regionId: string
  date: string
  tickets: Array<{ storeId: string; memberId: string | null; lines: CartLine[] }>
}

export interface RegionSettlement {
  regionId: string
  date: string
  grossTotal: number
  lineDiscountTotal: number
  orderDiscountTotal: number
  discountTotal: number
  netTotal: number
  perCategory: Record<string, number>
  offerUsage: Record<string, number>
  bonus: number
  storesVisited: string[]
  storesMissed: string[]
}

function round2(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  const sign = value < 0 ? -1 : 1
  const magnitude = Math.abs(value)
  const scaled = Math.round((magnitude + Number.EPSILON) * 100)
  return (scaled / 100) * sign
}

function sortEntriesByKey(record: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)))
}

export function settleRegion(input: SettleRegionInput): RegionSettlement {
  const region = getRegion(input.regionId)
  if (!region) {
    throw new Error(`Unknown region: ${input.regionId}`)
  }

  const regionStoreOrder: string[] = []
  const regionStoreSet = new Set<string>()

  for (const stop of region.stores) {
    if (!regionStoreSet.has(stop.storeId)) {
      regionStoreSet.add(stop.storeId)
      regionStoreOrder.push(stop.storeId)
    }
  }

  for (const ticket of input.tickets) {
    if (!regionStoreSet.has(ticket.storeId)) {
      throw new Error(`Store not in region: ${ticket.storeId}`)
    }
  }

  let grossTotal = 0
  let lineDiscountTotal = 0
  let orderDiscountTotal = 0
  let netTotal = 0

  const perCategory: Record<string, number> = {}
  const offerUsage: Record<string, number> = {}
  const storesVisitedSet = new Set<string>()

  for (const ticket of input.tickets) {
    const pricedTicket = priceTicket({ lines: ticket.lines, memberId: ticket.memberId, date: input.date })

    storesVisitedSet.add(ticket.storeId)

    const ticketGross = pricedTicket.lines.reduce((sum, line) => round2(sum + line.gross), 0)
    grossTotal = round2(grossTotal + ticketGross)

    const ticketLineDiscount = pricedTicket.lines.reduce((sum, line) => round2(sum + line.discount), 0)
    lineDiscountTotal = round2(lineDiscountTotal + ticketLineDiscount)

    orderDiscountTotal = round2(orderDiscountTotal + pricedTicket.orderLevel.discount)
    netTotal = round2(netTotal + pricedTicket.total)

    for (const line of pricedTicket.lines) {
      const menuItem = getMenuItem(line.productId)
      if (!menuItem) {
        continue
      }

      const category = menuItem.category
      perCategory[category] = round2((perCategory[category] ?? 0) + line.net)

      if (line.appliedOfferId !== null) {
        offerUsage[line.appliedOfferId] = (offerUsage[line.appliedOfferId] ?? 0) + 1
      }
    }

    if (pricedTicket.orderLevel.appliedOfferId !== null) {
      offerUsage[pricedTicket.orderLevel.appliedOfferId] =
        (offerUsage[pricedTicket.orderLevel.appliedOfferId] ?? 0) + 1
    }
  }

  const sortedPerCategory = sortEntriesByKey(perCategory)
  const sortedOfferUsage = sortEntriesByKey(offerUsage)

  const roundedNetTotal = round2(netTotal)
  let bonus = 0

  if (roundedNetTotal > 0) {
    const firstBand = Math.min(roundedNetTotal, 250)
    bonus = round2(bonus + firstBand * 0.03)

    const secondBand = Math.min(Math.max(roundedNetTotal - 250, 0), 500)
    bonus = round2(bonus + secondBand * 0.06)

    const thirdBand = Math.max(roundedNetTotal - 750, 0)
    bonus = round2(bonus + thirdBand * 0.1)
  }

  const storesVisited = regionStoreOrder.filter((storeId) => storesVisitedSet.has(storeId))
  const storesMissed = regionStoreOrder.filter((storeId) => !storesVisitedSet.has(storeId))

  const discountTotal = round2(lineDiscountTotal + orderDiscountTotal)

  return {
    regionId: input.regionId,
    date: input.date,
    grossTotal: round2(grossTotal),
    lineDiscountTotal: round2(lineDiscountTotal),
    orderDiscountTotal: round2(orderDiscountTotal),
    discountTotal: round2(discountTotal),
    netTotal: round2(netTotal),
    perCategory: sortedPerCategory,
    offerUsage: sortedOfferUsage,
    bonus: round2(bonus),
    storesVisited,
    storesMissed,
  }
}
