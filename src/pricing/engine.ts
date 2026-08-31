import { getMenu, getMenuItem, getMember, getOffers, type MenuItem, type Offer } from '../data'

export interface CartLine {
  productId: string
  qty: number
}

export interface PriceTicketInput {
  lines: CartLine[]
  memberId: string | null
  date: string
}

export interface PricedLine {
  productId: string
  qty: number
  unitPrice: number
  gross: number
  appliedOfferId: string | null
  discount: number
  net: number
}

export interface PricedTicket {
  lines: PricedLine[]
  orderLevel: { appliedOfferId: string | null; discount: number }
  subtotal: number
  total: number
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function round2(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  const sign = value < 0 ? -1 : 1
  const magnitude = Math.abs(value)
  const rounded = Math.round((magnitude + Number.EPSILON) * 100) / 100

  return sign * rounded
}

function getWeekday(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return WEEKDAY_NAMES[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
}

function offerIsActive(offer: Offer, ticketDate: string, memberId: string | null): boolean {
  if (!(offer.validFrom <= ticketDate && ticketDate <= offer.validTo)) {
    return false
  }

  if (offer.dayOfWeek) {
    const weekday = getWeekday(ticketDate) as (typeof WEEKDAY_NAMES)[number]
    if (!offer.dayOfWeek.includes(weekday)) {
      return false
    }
  }

  if (offer.eligibleTiers) {
    if (memberId === null) {
      return false
    }

    const member = getMember(memberId)
    if (!member || !offer.eligibleTiers.includes(member.tier)) {
      return false
    }
  }

  return true
}

function lineMatchesOffer(
  offer: Offer,
  productId: string,
  productById: Map<string, MenuItem>,
): boolean {
  const product = productById.get(productId)
  if (!product) {
    return false
  }

  if (offer.type === 'percent_off') {
    if (offer.scope.category) {
      return offer.scope.category === product.category
    }

    if (offer.scope.productIds) {
      return offer.scope.productIds.includes(productId)
    }

    return false
  }

  if (offer.type === 'bundle') {
    return productId === offer.products[0]
  }

  return false
}

function lineOfferDiscount(
  offer: Offer,
  productId: string,
  gross: number,
  productById: Map<string, MenuItem>,
  qtyByProduct: Map<string, number>,
): number {
  if (offer.type === 'percent_off') {
    const product = productById.get(productId)
    if (!product) {
      return 0
    }

    if (offer.scope.category && product.category !== offer.scope.category) {
      return 0
    }

    if (offer.scope.productIds && !offer.scope.productIds.includes(productId)) {
      return 0
    }

    return round2(gross * (offer.percent / 100))
  }

  if (offer.type === 'bundle') {
    if (productId !== offer.products[0]) {
      return 0
    }

    const buyQty = qtyByProduct.get(offer.products[0]) ?? 0
    const getQty = qtyByProduct.get(offer.products[1]) ?? 0
    const pairs = Math.min(buyQty, getQty)

    if (pairs <= 0) {
      return 0
    }

    return round2(pairs * offer.amountOff)
  }

  return 0
}

function compareOfferWinner(
  left: { id: string; validFrom: string; discount: number },
  right: { id: string; validFrom: string; discount: number },
): boolean {
  if (left.discount > right.discount + 1e-9) {
    return true
  }

  if (Math.abs(left.discount - right.discount) <= 1e-9) {
    if (left.validFrom < right.validFrom) {
      return true
    }

    if (left.validFrom === right.validFrom && left.id < right.id) {
      return true
    }
  }

  return false
}

export function priceTicket(input: PriceTicketInput): PricedTicket {
  if (input.memberId !== null && !getMember(input.memberId)) {
    throw new Error(`Unknown member: ${input.memberId}`)
  }

  const menu = getMenu()
  const offers = getOffers()
  const productById = new Map<string, MenuItem>(menu.map((item) => [item.id, item]))
  const qtyByProduct = new Map<string, number>()

  for (const line of input.lines) {
    const product = productById.get(line.productId)
    if (!product) {
      throw new Error(`Unknown product: ${line.productId}`)
    }

    if (!Number.isInteger(line.qty) || line.qty <= 0) {
      throw new Error(`Invalid qty for ${line.productId}`)
    }

    qtyByProduct.set(line.productId, (qtyByProduct.get(line.productId) ?? 0) + line.qty)
  }

  const pricedLines: PricedLine[] = input.lines.map((line) => {
    const product = productById.get(line.productId)
    if (!product) {
      throw new Error(`Unknown product: ${line.productId}`)
    }

    const gross = round2(product.basePrice * line.qty)
    let bestOffer: { id: string; validFrom: string; discount: number } | null = null

    for (const offer of offers) {
      if (offer.type === 'spend_threshold') {
        continue
      }

      if (!offerIsActive(offer, input.date, input.memberId)) {
        continue
      }

      if (!lineMatchesOffer(offer, line.productId, productById)) {
        continue
      }

      const candidate = lineOfferDiscount(offer, line.productId, gross, productById, qtyByProduct)
      const clamped = Math.min(candidate, gross)

      if (clamped <= 0) {
        continue
      }

      if (!bestOffer || compareOfferWinner({ id: offer.id, validFrom: offer.validFrom, discount: clamped }, bestOffer)) {
        bestOffer = { id: offer.id, validFrom: offer.validFrom, discount: clamped }
      }
    }

    const discount = bestOffer ? round2(bestOffer.discount) : 0
    const net = round2(Math.max(0, gross - discount))

    return {
      productId: line.productId,
      qty: line.qty,
      unitPrice: product.basePrice,
      gross,
      appliedOfferId: bestOffer ? bestOffer.id : null,
      discount,
      net,
    }
  })

  const subtotal = round2(
    pricedLines.reduce((sum, line) => {
      return round2(sum + line.net)
    }, 0),
  )

  let bestOrderOffer: { id: string; validFrom: string; discount: number } | null = null

  for (const offer of offers) {
    if (offer.type !== 'spend_threshold') {
      continue
    }

    if (!offerIsActive(offer, input.date, input.memberId)) {
      continue
    }

    const categoryTotal = offer.category
      ? round2(
          pricedLines
            .filter((line) => {
              const product = getMenuItem(line.productId)
              return Boolean(product && product.category === offer.category)
            })
            .reduce((sum, line) => round2(sum + line.net), 0),
        )
      : subtotal

    if (categoryTotal < offer.minSubtotal) {
      continue
    }

    const candidate = round2(offer.amountOff)
    if (candidate <= 0) {
      continue
    }

    if (!bestOrderOffer || compareOfferWinner({ id: offer.id, validFrom: offer.validFrom, discount: candidate }, bestOrderOffer)) {
      bestOrderOffer = { id: offer.id, validFrom: offer.validFrom, discount: candidate }
    }
  }

  const orderLevelDiscount = bestOrderOffer ? round2(bestOrderOffer.discount) : 0
  const total = round2(Math.max(0, subtotal - orderLevelDiscount))

  return {
    lines: pricedLines,
    orderLevel: {
      appliedOfferId: bestOrderOffer ? bestOrderOffer.id : null,
      discount: orderLevelDiscount,
    },
    subtotal,
    total,
  }
}
