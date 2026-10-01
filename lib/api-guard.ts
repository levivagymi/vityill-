import { SITE_URL } from './site'

/**
 * Request gates for the public form endpoints (/api/contact, /api/booking).
 * Pure functions over standard Request/Headers - no framework state, no I/O
 * beyond reading the body - so every branch is unit-testable.
 *
 * Rate limiting is deliberately NOT done here. On Vercel every invocation may
 * land on a different instance, so an in-memory counter is per-instance and
 * trivially bypassed - worse than nothing, because it looks like protection.
 * Limits belong in the Vercel Firewall (see docs/launch-checklist.md).
 */

export type GuardFailure = { ok: false; status: 400 | 403 | 413 | 415; error: string }
export type GuardResult<T> = { ok: true; value: T } | GuardFailure

const fail = (status: GuardFailure['status'], error: string): GuardFailure => ({ ok: false, status, error })

/** Generous for these forms: the largest legitimate payload (a booking with a
 *  2000-character request) is well under 4 KB. */
export const MAX_JSON_BODY_BYTES = 16 * 1024

/** Name of the off-screen bot-trap field (components/ui/Honeypot.tsx). */
export const HONEYPOT_FIELD = 'website'

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase()
  } catch {
    return null
  }
}

/** Hosts allowed to post besides the request's own Host: the apex and www
 *  production names (a www<->apex mismatch must never 403 a real guest) and
 *  the deployment URLs Vercel exposes to the runtime. */
export function siteAllowedHosts(env: Record<string, string | undefined> = process.env): string[] {
  const apex = new URL(SITE_URL).host
  const hosts = [apex, `www.${apex}`]
  for (const key of ['VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL']) {
    const value = env[key]
    if (value) hosts.push(value)
  }
  return hosts
}

/**
 * Rejects cross-site form posts, in layers:
 *   1. Sec-Fetch-Site: cross-site  -> reject (modern browsers always send it).
 *   2. Origin present              -> its host must be the request's own host
 *                                     or an allowed host. The literal "null"
 *                                     origin (sandboxed frames, file://) fails.
 *   3. else Referer present        -> same host test (older WebViews and some
 *                                     privacy extensions strip Origin).
 *   4. neither                     -> allowed; the honeypot is then the main
 *                                     defence against scripted posts.
 */
export function checkRequestOrigin(headers: Headers, allowedHosts: readonly string[]): { ok: true } | GuardFailure {
  if (headers.get('sec-fetch-site') === 'cross-site') return fail(403, 'cross_site')

  const allowed = new Set(allowedHosts.map((h) => h.toLowerCase()))
  for (const name of ['host', 'x-forwarded-host']) {
    const value = headers.get(name)
    if (value) allowed.add(value.toLowerCase())
  }

  const origin = headers.get('origin')
  if (origin !== null) {
    const host = hostOf(origin)
    return host !== null && allowed.has(host) ? { ok: true } : fail(403, 'origin_mismatch')
  }

  const referer = headers.get('referer')
  if (referer !== null) {
    const host = hostOf(referer)
    return host !== null && allowed.has(host) ? { ok: true } : fail(403, 'referer_mismatch')
  }

  return { ok: true }
}

/** Reads the body as UTF-8, aborting as soon as it exceeds maxBytes - the
 *  Content-Length header can be absent (chunked) or simply lie. */
async function readTextCapped(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

/** JSON body with a content-type check (415), a size cap (413) and a parse
 *  check (400). The value is still `unknown` - schema validation comes next. */
export async function readJsonBody(request: Request, maxBytes = MAX_JSON_BODY_BYTES): Promise<GuardResult<unknown>> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!/^application\/json(\s*;|$)/i.test(contentType.trim())) return fail(415, 'unsupported_media_type')

  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) return fail(413, 'payload_too_large')

  const text = await readTextCapped(request, maxBytes)
  if (text === null) return fail(413, 'payload_too_large')

  try {
    return { ok: true, value: JSON.parse(text) as unknown }
  } catch {
    return fail(400, 'invalid_json')
  }
}

/** True when the bot-trap field carries anything. Checked before schema
 *  validation so a bot gets the same 200 a person would, not a 422 hint. */
export function isHoneypotFilled(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false
  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD]
  if (value === undefined || value === null) return false
  return typeof value === 'string' ? value.trim() !== '' : true
}
