import { getStores, getTickets } from '../data'

export interface StoreAudit {
  storeId: string
  weightedScore: number | null
  trend: 'up' | 'down' | 'flat' | null
  daysSinceLastTicket: number | null
  dormant: boolean
  status: 'thriving' | 'attention' | 'critical' | 'inactive'
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 24 * 60 * 60 * 1000

function round2(value: number): number {
  const sign = value < 0 ? -1 : 1
  const magnitude = Math.abs(value)
  const scaled = Math.round((magnitude + Number.EPSILON) * 100)
  return (scaled / 100) * sign
}

function parseUtcDate(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

export function auditStores(asOf: string): StoreAudit[] {
  if (!DATE_RE.test(asOf)) {
    throw new Error(`Invalid date: ${asOf}`)
  }

  const stores = getStores().slice().sort((a, b) => a.id.localeCompare(b.id))
  const allTickets = getTickets()

  return stores.map((store) => {
    const countedTickets = allTickets
      .filter((ticket) => ticket.storeId === store.id && ticket.date <= asOf)
      .sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date)
        }
        return b.id.localeCompare(a.id)
      })

    let weightedScore: number | null = null
    if (countedTickets.length > 0) {
      const recent = countedTickets.slice(0, 4)
      const weights = [4, 3, 2, 1]
      const used = recent.map((ticket, index) => ticket.csat * weights[index])
      const weightedSum = used.reduce((sum, value) => sum + value, 0)
      const divisor = weights.slice(0, recent.length).reduce((sum, value) => sum + value, 0)
      weightedScore = round2(weightedSum / divisor)
    }

    let trend: 'up' | 'down' | 'flat' | null = null
    if (countedTickets.length >= 2) {
      const comparisonGroup = countedTickets.slice(1, 4)
      const prevMean = round2(
        comparisonGroup.reduce((sum, ticket) => sum + ticket.csat, 0) / comparisonGroup.length,
      )
      const newestCsat = countedTickets[0].csat

      if (newestCsat > prevMean) {
        trend = 'up'
      } else if (newestCsat < prevMean) {
        trend = 'down'
      } else {
        trend = 'flat'
      }
    }

    let daysSinceLastTicket: number | null = null
    if (countedTickets.length > 0) {
      const latestDate = countedTickets[0].date
      daysSinceLastTicket = Math.floor((parseUtcDate(asOf) - parseUtcDate(latestDate)) / DAY_MS)
    }

    const dormant = daysSinceLastTicket === null || daysSinceLastTicket > 21

    let status: StoreAudit['status']
    if (weightedScore === null) {
      status = 'inactive'
    } else if (weightedScore < 3) {
      status = 'critical'
    } else if (weightedScore < 4) {
      status = 'attention'
    } else {
      status = 'thriving'
    }

    return {
      storeId: store.id,
      weightedScore,
      trend,
      daysSinceLastTicket,
      dormant,
      status,
    }
  })
}
