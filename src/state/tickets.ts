// Ticket persistence. Saved tickets carry the full PricedTicket breakdown
// (see SPEC.md §2) plus the store, member (if any), and date they were
// captured for.

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

export interface SavedTicket extends PricedTicket {
  storeId: string
  memberId: string | null
  date: string // ISO date
}

const STORAGE_KEY = 'brewops.tickets'

export function getSavedTickets(): SavedTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedTicket[]) : []
  } catch {
    return []
  }
}

export function saveTicket(ticket: SavedTicket): void {
  const tickets = getSavedTickets()
  tickets.push(ticket)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
}
