/**
 * Curated availability calendar — honest, editable data, no fake liveness.
 * The house is open by default; the ranges below mark confirmed bookings and
 * tentative holds. Dates are [checkIn, checkOut) — checkout day is free again.
 */
import { todayISO } from '@/lib/booking'

export type DayStatus = 'open' | 'held' | 'booked'
export type OpenWindow = { start: string; end: string; nights: number }

export const MIN_NIGHTS = 2

/** Confirmed bookings (edit by hand as reservations come in). */
const BOOKED: [string, string][] = [
  ['2026-07-10', '2026-07-14'],
  ['2026-07-24', '2026-07-28'],
  ['2026-08-07', '2026-08-16'],
  ['2026-08-20', '2026-08-24'],
  ['2026-09-04', '2026-09-07'],
  ['2026-10-23', '2026-10-26'],
  ['2026-12-30', '2027-01-02'],
]

/** Tentative holds awaiting confirmation. */
const HELD: [string, string][] = [
  ['2026-07-17', '2026-07-19'],
  ['2026-08-28', '2026-08-31'],
  ['2026-09-18', '2026-09-21'],
]

const toISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const addDays = (iso: string, days: number): string => {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d + days)
  return toISO(date)
}

const inRange = (iso: string, ranges: [string, string][]) =>
  ranges.some(([start, end]) => iso >= start && iso < end)

export function dayStatus(iso: string): DayStatus {
  if (inRange(iso, BOOKED)) return 'booked'
  if (inRange(iso, HELD)) return 'held'
  return 'open'
}

export type Season = 'low' | 'mid' | 'high'

export function seasonOf(iso: string): Season {
  const month = Number(iso.split('-')[1])
  if (month >= 6 && month <= 8) return 'high'
  if (month === 4 || month === 5 || month === 9 || month === 10 || month === 12) return 'mid'
  return 'low'
}

/** Consecutive fully-open runs of at least MIN_NIGHTS, scanning forward. */
export function nextOpenWindows(fromISO = todayISO(), count = 3, horizonDays = 120): OpenWindow[] {
  const windows: OpenWindow[] = []
  let cursor = fromISO
  let runStart: string | null = null

  for (let i = 0; i <= horizonDays && windows.length < count; i++) {
    const open = dayStatus(cursor) === 'open'
    if (open && runStart === null) runStart = cursor
    if ((!open || i === horizonDays) && runStart !== null) {
      const end = cursor
      const nights = Math.round(
        (new Date(end).getTime() - new Date(runStart).getTime()) / 86_400_000,
      )
      if (nights >= MIN_NIGHTS) {
        // Long runs read better capped — nobody scans a 30-night pill.
        const cappedEnd = nights > 14 ? addDays(runStart, 14) : end
        windows.push({ start: runStart, end: cappedEnd, nights: Math.min(nights, 14) })
      }
      runStart = null
    }
    cursor = addDays(cursor, 1)
  }
  return windows
}

/** How many of the next `days` nights are open — the strip's headline number. */
export function openNightCount(fromISO = todayISO(), days = 60): number {
  let n = 0
  let cursor = fromISO
  for (let i = 0; i < days; i++) {
    if (dayStatus(cursor) === 'open') n++
    cursor = addDays(cursor, 1)
  }
  return n
}

/** Day-by-day statuses for the compact heat strip (weeks × 7 cells). */
export function weeksGrid(fromISO = todayISO(), weeks = 8): { iso: string; status: DayStatus }[] {
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const iso = addDays(fromISO, i)
    return { iso, status: dayStatus(iso) }
  })
}
