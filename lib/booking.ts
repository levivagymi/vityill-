/**
 * Rates, guest limits and stay maths for Vityillo.
 *
 * Deliberately zod-free: About, Rooms and AvailabilityStrip all import a
 * constant or a formatter from here, so anything this module pulls in lands in
 * the homepage's initial bundle. The request-validation schema - which does
 * need zod, ~290 kB of it - lives in ./booking-schema and is imported only by
 * the API route that actually validates a payload.
 */
import type { Locale } from './types'

/** Set to true when the site is ready to accept real bookings. */
export const BOOKING_ENABLED = false

/** Whole-house booking; site-wide occupancy cap. */
export const MAX_GUESTS = 6

/** Shortest bookable stay, in nights. */
export const MIN_NIGHTS = 2

/** Booking contact must be an adult; oldest accepted birth year is a sanity bound. */
export const MIN_BIRTH_YEAR = 1900
export const MAX_BIRTH_YEAR = new Date().getFullYear() - 18

/** Today as a yyyy-mm-dd string in local time. */
export const todayISO = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Whole nights between two ISO date strings (yyyy-mm-dd). Returns 0 if invalid/negative. */
export function nightsBetween(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 0
  const a = new Date(checkIn)
  const b = new Date(checkOut)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  const ms = b.getTime() - a.getTime()
  const nights = Math.round(ms / 86_400_000)
  return nights > 0 ? nights : 0
}

export type DayType = 'weekday' | 'weekend'
export type GroupTier = 'small' | 'large' // small = 1-2 paid fő, large = 3-6 paid fő

/** HUF, per person, per night. */
export const RATE_TABLE: Record<DayType, Record<GroupTier, number>> = {
  weekday: { small: 30_000, large: 25_000 }, // Mon-Thu
  weekend: { small: 35_000, large: 30_000 }, // Fri-Sun
} as const

/** "Weekend" = the night's start date is Fri/Sat/Sun. getUTCDay() on purpose -
 *  ISO date-only strings parse as UTC midnight, avoiding a local-timezone
 *  off-by-one for a visitor whose browser clock is in another UTC offset. */
export function nightDayType(dateISO: string): DayType {
  const day = new Date(dateISO).getUTCDay() // 0=Sun..6=Sat
  return day === 5 || day === 6 || day === 0 ? 'weekend' : 'weekday'
}

export const NUMBER_LOCALE: Record<Locale, string> = { hu: 'hu-HU', en: 'en-US', de: 'de-DE' }

export const formatHUF = (amount: number, locale: Locale): string =>
  `${amount.toLocaleString(NUMBER_LOCALE[locale])} Ft`

/** Indicative "from" rate shown on marketing cards: the 1-2 fő tier for
 *  today's day-type, per person/night — even a single guest can book. */
export const fromRatePerPerson = (): number => RATE_TABLE[nightDayType(todayISO())].small

export type StayInput = {
  checkIn: string; checkOut: string
  adults: number; childrenUnder4: number; childrenOver4: number
}
export type PriceBreakdownGroup = {
  type: DayType; nights: number; ratePerPerson: number; guestCount: number; subtotal: number
}
export type PriceEstimate = {
  nights: number
  paidGuestCount: number    // adults + childrenOver4 - tier bracket + billing
  totalGuestCount: number   // adults + childrenUnder4 + childrenOver4 - occupancy cap only
  breakdown: PriceBreakdownGroup[]  // <=2 entries (one per day-type actually present)
  total: number
}

/** Single source of truth for stay pricing, consumed by BookingWizard's live
 *  sidebar (called on every keystroke, often with incomplete input - stays
 *  lenient, returns a zero estimate rather than throwing). */
export function calculateStayPrice(input: StayInput): PriceEstimate {
  const nights = nightsBetween(input.checkIn, input.checkOut)
  const adults = Number.isFinite(input.adults) ? Math.max(0, input.adults) : 0
  const childrenUnder4 = Number.isFinite(input.childrenUnder4) ? Math.max(0, input.childrenUnder4) : 0
  const childrenOver4 = Number.isFinite(input.childrenOver4) ? Math.max(0, input.childrenOver4) : 0
  const paidGuestCount = adults + childrenOver4
  const totalGuestCount = paidGuestCount + childrenUnder4

  if (nights <= 0 || paidGuestCount <= 0) {
    return { nights, paidGuestCount, totalGuestCount, breakdown: [], total: 0 }
  }

  const tier: GroupTier = paidGuestCount <= 2 ? 'small' : 'large'
  const nightsByType = new Map<DayType, number>()
  const startMs = new Date(input.checkIn).getTime()
  for (let i = 0; i < nights; i++) {
    const dateISO = new Date(startMs + i * 86_400_000).toISOString().slice(0, 10)
    const type = nightDayType(dateISO)
    nightsByType.set(type, (nightsByType.get(type) ?? 0) + 1)
  }

  const breakdown: PriceBreakdownGroup[] = Array.from(nightsByType, ([type, groupNights]) => {
    const ratePerPerson = RATE_TABLE[type][tier]
    return { type, nights: groupNights, ratePerPerson, guestCount: paidGuestCount, subtotal: ratePerPerson * paidGuestCount * groupNights }
  })

  const total = breakdown.reduce((sum, g) => sum + g.subtotal, 0)
  return { nights, paidGuestCount, totalGuestCount, breakdown, total }
}

export const COUNTRIES = [
  'Magyarország', 'Ausztria', 'Németország', 'Szlovákia', 'Románia', 'Csehország',
  'Lengyelország', 'Horvátország', 'Szerbia', 'Ukrajna', 'Olaszország', 'Franciaország',
  'Egyesült Királyság', 'Spanyolország', 'Hollandia', 'Svájc', 'Belgium', 'Svédország',
  'Dánia', 'Norvégia', 'Finnország', 'Oroszország', 'USA', 'Kanada', 'Ausztrália',
  'Japán', 'Kína', 'India', 'Brazília', 'Argentína', 'Más / Other',
]
