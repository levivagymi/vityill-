import { useSyncExternalStore } from 'react'

/**
 * Visitor consent for optional third-party content.
 *
 * The site sets no tracking or advertising cookies. The only thing that needs
 * consent (ePrivacy art. 5(3) + GDPR) is the Google Maps embed, which hands the
 * visitor's IP to Google and may set Google cookies the moment it loads - so
 * there is exactly one optional category: `external`.
 *
 * Hydration: the server cannot read localStorage, so the server snapshot is
 * the constant UNKNOWN state. React also uses getServerSnapshot during the
 * hydration pass on the client and re-renders with getSnapshot() right after,
 * so server HTML and first client render always agree. Consumers must render
 * the same neutral output for `unknown` that the server produced.
 */

export const CONSENT_STORAGE_KEY = 'vityillo-consent-v1'
/** Pre-2026-10 banner value ('accepted' | 'declined'), collected with copy
 *  that never named Google Maps - not informed consent, so it is discarded
 *  and the visitor is asked again. */
export const LEGACY_CONSENT_KEY = 'vityillo-cookie-consent'

const CONSENT_VERSION = 1
const CHANGE_EVENT = 'vityillo:consent-change'
/** Fired by the footer's "cookie settings" control to reopen the banner. */
export const OPEN_CONSENT_SETTINGS_EVENT = 'vityillo:consent-open'

export type ConsentState =
  | { status: 'unknown' }
  | { status: 'undecided' }
  | { status: 'decided'; external: boolean; decidedAt: string }

const UNKNOWN: ConsentState = { status: 'unknown' }
const UNDECIDED: ConsentState = { status: 'undecided' }

/** Stored value -> state. Anything missing, malformed, or written by another
 *  schema version counts as "not decided yet", never as a yes. */
export function parseConsent(raw: string | null): ConsentState {
  if (raw === null) return UNDECIDED
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return UNDECIDED
  }
  if (typeof value !== 'object' || value === null) return UNDECIDED
  const record = value as Record<string, unknown>
  if (record.v !== CONSENT_VERSION) return UNDECIDED
  if (typeof record.external !== 'boolean') return UNDECIDED
  if (typeof record.decidedAt !== 'string') return UNDECIDED
  return { status: 'decided', external: record.external, decidedAt: record.decidedAt }
}

export function serializeConsent(external: boolean, decidedAt: Date): string {
  return JSON.stringify({ v: CONSENT_VERSION, external, decidedAt: decidedAt.toISOString() })
}

/** useSyncExternalStore compares snapshots with Object.is - returning a fresh
 *  object for an unchanged value would re-render forever. Memoise on the raw
 *  string so the same stored value always yields the same object. */
export function createSnapshotReader(read: () => string | null): () => ConsentState {
  let lastRaw: string | null | undefined
  let lastState: ConsentState = UNDECIDED
  return () => {
    const raw = read()
    if (raw !== lastRaw) {
      lastRaw = raw
      lastState = parseConsent(raw)
    }
    return lastState
  }
}

// ── Browser store ───────────────────────────────────────────────────────────

/** Fallback when storage is blocked (private mode, disabled site data): the
 *  decision still holds for this page lifetime instead of re-asking on every
 *  render. */
let memoryValue: string | null = null

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY)
  } catch {
    return memoryValue
  }
}

function writeRaw(value: string) {
  memoryValue = value
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value)
  } catch {
    // Storage blocked - memoryValue already carries the decision.
  }
}

let legacyCleared = false
function clearLegacyKey() {
  if (legacyCleared) return
  legacyCleared = true
  try {
    window.localStorage.removeItem(LEGACY_CONSENT_KEY)
  } catch {
    // Storage blocked - nothing was stored under the old key either.
  }
}

const getSnapshot = createSnapshotReader(readRaw)
const getServerSnapshot = (): ConsentState => UNKNOWN

function subscribe(onChange: () => void) {
  clearLegacyKey()
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_STORAGE_KEY || e.key === null) onChange()
  }
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function setConsent(choice: { external: boolean }) {
  writeRaw(serializeConsent(choice.external, new Date()))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Withdrawing consent must be as easy as giving it (GDPR art. 7(3)). */
export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_CONSENT_SETTINGS_EVENT))
}

export function hasExternalConsent(state: ConsentState): boolean {
  return state.status === 'decided' && state.external
}
