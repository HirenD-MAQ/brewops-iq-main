// Typed loaders for the static catalog data. All app code (and the pricing
// engine, per SPEC.md) should read data through these helpers, not fetch.
import menuJson from './menu.json'
import membersJson from './members.json'
import offersJson from './offers.json'
import storesJson from './stores.json'
import regionsJson from './regions.json'
import ticketsJson from './tickets.json'

export interface MenuItem {
  id: string
  name: string
  category: string
  basePrice: number
}

export interface Member {
  id: string
  name: string
  tier: 'basic' | 'silver' | 'gold'
  joined: string        // ISO date
  homeStoreId: string
}

interface OfferBase {
  id: string
  name: string
  validFrom: string     // ISO date, inclusive
  validTo: string       // ISO date, inclusive
  eligibleTiers?: Array<'basic' | 'silver' | 'gold'>
  dayOfWeek?: Array<'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'>
}

export interface PercentOffOffer extends OfferBase {
  type: 'percent_off'
  percent: number
  scope: { category?: string; productIds?: string[] }
}

export interface BundleOffer extends OfferBase {
  type: 'bundle'
  products: [string, string]     // exactly two distinct product ids
  amountOff: number              // dollars off per completed bundle pair
}

export interface SpendThresholdOffer extends OfferBase {
  type: 'spend_threshold'
  category?: string              // absent = any category (whole order net)
  minSubtotal: number
  amountOff: number
}

export type Offer = PercentOffOffer | BundleOffer | SpendThresholdOffer

export interface Store {
  id: string
  name: string
  region: string
  openHour: number
  closeHour: number
}

export interface RegionStore {
  storeId: string
  openTime: string      // "HH:MM"
}

export interface Region {
  id: string
  name: string
  stores: RegionStore[]
}

export interface Ticket {
  id: string
  storeId: string
  date: string          // ISO date
  csat: number          // 1-5
  notes: string
}

const menu = menuJson as MenuItem[]
const members = membersJson as Member[]
const offers = offersJson as Offer[]
const stores = storesJson as Store[]
const regions = regionsJson as Region[]
const tickets = ticketsJson as Ticket[]

export function getMenu(): MenuItem[] {
  return menu
}

export function getMembers(): Member[] {
  return members
}

export function getOffers(): Offer[] {
  return offers
}

export function getStores(): Store[] {
  return stores
}

export function getRegions(): Region[] {
  return regions
}

export function getTickets(): Ticket[] {
  return tickets
}

export function getMenuItem(id: string): MenuItem | undefined {
  return menu.find((m) => m.id === id)
}

export function getMember(id: string): Member | undefined {
  return members.find((m) => m.id === id)
}

export function getStore(id: string): Store | undefined {
  return stores.find((s) => s.id === id)
}

export function getRegion(id: string): Region | undefined {
  return regions.find((r) => r.id === id)
}
