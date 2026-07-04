/**
 * Cross-route shared-element handoff. A click on a flip source (room card
 * image) records its rect + image just before Next.js navigates; the
 * destination page consumes the record and FLIP-animates a clone into the
 * hero. Module state survives client-side navigation because the JS context
 * does. PageTransitionOverlay checks hasPendingFlip() to skip its wipe —
 * the shared element IS the transition for these routes.
 */

export type FlipRecord = {
  rect: { top: number; left: number; width: number; height: number }
  src: string
  ts: number
}

const MAX_AGE_MS = 2500
/** How long after consumption the wipe should still stand down. */
const ACTIVE_GRACE_MS = 1200

let record: FlipRecord | null = null
let consumedAt = 0

export function setPendingFlip(el: HTMLElement, src: string) {
  const r = el.getBoundingClientRect()
  record = {
    rect: { top: r.top, left: r.left, width: r.width, height: r.height },
    src,
    ts: Date.now(),
  }
}

export function consumePendingFlip(): FlipRecord | null {
  if (!record || Date.now() - record.ts > MAX_AGE_MS) {
    record = null
    return null
  }
  const r = record
  record = null
  consumedAt = Date.now()
  return r
}

export function hasPendingFlip(): boolean {
  if (record && Date.now() - record.ts <= MAX_AGE_MS) return true
  return Date.now() - consumedAt <= ACTIVE_GRACE_MS
}
