import { z } from 'zod'
import {
  BOOKING_CHANNELS,
  MAX_GUESTS,
  MIN_NIGHTS,
  nightsBetween,
  todayISO,
} from './booking'
import { localeSchema, singleLine } from './validation'

/**
 * Server-side booking validation. Split out of ./booking so that importing a
 * rate constant on the homepage does not drag zod into the initial bundle -
 * only the /api/booking route handler needs this module, and that runs on the
 * server where the dependency is free.
 *
 * Data minimisation: only what a booking *request* needs. NTAK/VIZA guest
 * data is recorded at check-in, never collected through the website.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Server-side validation schema (locale-independent messages). */
export const bookingServerSchema = z
  .object({
    name: singleLine(120).pipe(z.string().min(1)),
    email: z.string().trim().pipe(z.email()),
    phone: singleLine(40).pipe(z.string().min(3)),
    checkIn: z.string().regex(ISO_DATE),
    checkOut: z.string().regex(ISO_DATE),
    adults: z.number().int().min(1).max(MAX_GUESTS),
    childrenUnder4: z.number().int().min(0).max(MAX_GUESTS),
    childrenOver4: z.number().int().min(0).max(MAX_GUESTS),
    channel: z.enum(BOOKING_CHANNELS).optional(),
    requests: z.string().max(2000).optional().default(''),
    locale: localeSchema.optional(),
  })
  // ISO yyyy-mm-dd strings compare correctly as plain strings.
  .refine((d) => d.checkOut > d.checkIn, {
    message: 'check-out must be after check-in',
    path: ['checkOut'],
  })
  .refine((d) => nightsBetween(d.checkIn, d.checkOut) >= MIN_NIGHTS, {
    message: `minimum stay is ${MIN_NIGHTS} nights`,
    path: ['checkOut'],
  })
  .refine((d) => d.checkIn >= todayISO(), {
    message: 'check-in must not be in the past',
    path: ['checkIn'],
  })
  .refine((d) => d.adults + d.childrenUnder4 + d.childrenOver4 <= MAX_GUESTS, {
    message: 'too many guests',
    path: ['adults'],
  })

export type BookingPayload = z.infer<typeof bookingServerSchema>
