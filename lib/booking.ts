import { z } from 'zod'

/** Set to true when the site is ready to accept real bookings. */
export const BOOKING_ENABLED = false

/** Nightly prices in EUR, indicative, for two guests. */
export const ROOM_PRICES = { room1: 120, room2: 100, both: 200 } as const
export const CLEANING_FEE = 35 // EUR, one-off
export const MAX_GUESTS = 10

/** Booking contact must be an adult; oldest accepted birth year is a sanity bound. */
export const MIN_BIRTH_YEAR = 1900
export const MAX_BIRTH_YEAR = new Date().getFullYear() - 18

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Today as a yyyy-mm-dd string in local time. */
export const todayISO = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export type RoomChoice = keyof typeof ROOM_PRICES

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

export function estimateTotal(room: RoomChoice, nights: number) {
  const accommodation = ROOM_PRICES[room] * nights
  return { accommodation, cleaning: nights > 0 ? CLEANING_FEE : 0, total: accommodation + (nights > 0 ? CLEANING_FEE : 0) }
}

/** Server-side validation schema (locale-independent messages). */
export const bookingServerSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().pipe(z.email()),
    phone: z.string().trim().min(3).max(40),
    checkIn: z.string().regex(ISO_DATE),
    checkOut: z.string().regex(ISO_DATE),
    adults: z.number().int().min(1).max(MAX_GUESTS),
    children: z.number().int().min(0).max(MAX_GUESTS),
    childrenAges: z.string().max(100).optional().default(''),
    nationality: z.string().min(1),
    residence: z.string().min(1),
    postalCode: z.string().trim().min(1).max(20),
    gender: z.enum(['male', 'female', 'other']),
    birthYear: z.number().int().min(MIN_BIRTH_YEAR).max(MAX_BIRTH_YEAR),
    room: z.enum(['room1', 'room2', 'both']),
    channel: z.enum(['direct', 'airbnb', 'booking', 'facebook', 'other']),
    requests: z.string().max(2000).optional().default(''),
    locale: z.string().max(5).optional(),
  })
  // ISO yyyy-mm-dd strings compare correctly as plain strings.
  .refine((d) => d.checkOut > d.checkIn, {
    message: 'check-out must be after check-in',
    path: ['checkOut'],
  })
  .refine((d) => d.checkIn >= todayISO(), {
    message: 'check-in must not be in the past',
    path: ['checkIn'],
  })
  .refine((d) => d.adults + d.children <= MAX_GUESTS, {
    message: 'too many guests',
    path: ['adults'],
  })

export type BookingPayload = z.infer<typeof bookingServerSchema>

export const COUNTRIES = [
  'Magyarország', 'Ausztria', 'Németország', 'Szlovákia', 'Románia', 'Csehország',
  'Lengyelország', 'Horvátország', 'Szerbia', 'Ukrajna', 'Olaszország', 'Franciaország',
  'Egyesült Királyság', 'Spanyolország', 'Hollandia', 'Svájc', 'Belgium', 'Svédország',
  'Dánia', 'Norvégia', 'Finnország', 'Oroszország', 'USA', 'Kanada', 'Ausztrália',
  'Japán', 'Kína', 'India', 'Brazília', 'Argentína', 'Más / Other',
]
