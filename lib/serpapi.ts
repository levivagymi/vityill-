import 'server-only'
import type { Locale } from '@/lib/types'

/** Vityilló's Google Business Profile as SerpApi's `data_id` (`<feature_id>:<cid>`).
 *  Decoded from the same Google Maps CID already embedded in the embed-iframe
 *  `src` in app/[lang]/kapcsolat/page.tsx and components/sections/LocationMap.tsx
 *  (`!1s0x476a4f3c8d51135d%3A0xb90cf9714fdda3b!`). Deliberately duplicated here
 *  rather than shared with those files - this is a fresh, single-purpose
 *  constant for the reviews integration; refactoring the iframe URLs is out
 *  of scope. If the Maps listing is ever re-verified/merged, update both. */
const GOOGLE_MAPS_DATA_ID = '0x476a4f3c8d51135d:0xb90cf9714fdda3b'

/** Reviews change rarely; this keeps SerpApi usage (metered, paid) to at most
 *  a handful of calls/day regardless of traffic, via fetch's Data Cache. */
const REVIEWS_REVALIDATE_SECONDS = 21_600 // 6h - raise to 86_400 to conserve credits further

/** SerpApi's first page always returns exactly 8 raw reviews (across all
 *  sources, including rating-only ones); after filtering to Google-sourced
 *  reviews with real text, that can land below GuestStories.tsx's
 *  MIN_LIVE_REVIEWS (6) - the live wall needs headroom above that threshold,
 *  not just to graze it. If page 1 doesn't clear this, one more page is
 *  fetched via `next_page_token` and merged in. Capped at 2 pages total so
 *  a sparse listing can't chain indefinitely. */
const TARGET_USABLE_REVIEWS = 8
const MAX_PAGES = 2

export type GoogleReview = {
  id: string
  name: string
  rating: number
  text: string
}

type SerpApiRawReview = {
  review_id?: string
  source?: string
  rating?: number
  user?: { name?: string }
  snippet?: string
  extracted_snippet?: { original?: string; translated?: string }
}
type SerpApiReviewsResponse = {
  reviews?: SerpApiRawReview[]
  error?: string
  serpapi_pagination?: { next_page_token?: string }
}

/** Mirrors the old trustindex parser's defensive philosophy: skip individual
 *  bad/non-Google-sourced reviews, never fail the whole batch. */
function parseReview(raw: SerpApiRawReview): GoogleReview | null {
  if (raw.source !== 'Google') return null
  const id = raw.review_id
  const name = raw.user?.name?.trim()
  const text = (raw.extracted_snippet?.original || raw.extracted_snippet?.translated || raw.snippet || '').trim()
  if (!id || !name || !text) return null
  return { id, name, rating: Number.isFinite(raw.rating) ? (raw.rating as number) : 0, text }
}

/** Fetches one page of raw SerpApi results. Returns null on any failure
 *  (network, non-OK HTTP, SerpApi's own `error` field) - the caller treats
 *  that as "no more pages", never as a reason to throw. */
async function fetchPage(hl: Locale, apiKey: string, nextPageToken?: string): Promise<SerpApiReviewsResponse | null> {
  const url = new URL('https://serpapi.com/search.json')
  url.searchParams.set('engine', 'google_maps_reviews')
  url.searchParams.set('data_id', GOOGLE_MAPS_DATA_ID)
  url.searchParams.set('hl', hl)
  url.searchParams.set('api_key', apiKey)
  if (nextPageToken) url.searchParams.set('next_page_token', nextPageToken)

  let res: Response
  try {
    res = await fetch(url, { next: { revalidate: REVIEWS_REVALIDATE_SECONDS } })
  } catch (err) {
    console.warn('[reviews] SerpApi request failed:', (err as Error).message)
    return null
  }

  // Never log `url`/`res.url` - it carries api_key as a query param.
  if (!res.ok) {
    console.warn(`[reviews] SerpApi returned HTTP ${res.status}`)
    return null
  }

  const json = (await res.json()) as SerpApiReviewsResponse
  if (json.error) {
    console.warn('[reviews] SerpApi error:', json.error)
    return null
  }
  return json
}

/** Server-only. Every failure mode (no key, request failure, too few
 *  results even after pagination) resolves to [] rather than throwing -
 *  GuestStories.tsx's MIN_LIVE_REVIEWS already treats "too few live reviews"
 *  as "show curated testimonials", so "zero" needs no separate error UI. */
export async function fetchGoogleReviews(hl: Locale): Promise<GoogleReview[]> {
  const apiKey = process.env.SERPAPI_API_KEY
  if (!apiKey) {
    console.info('[reviews] SERPAPI_API_KEY not set - skipping live reviews')
    return []
  }

  const found = new Map<string, GoogleReview>()
  let nextPageToken: string | undefined
  let page = 0

  do {
    const data = await fetchPage(hl, apiKey, nextPageToken)
    if (!data) break
    for (const raw of data.reviews ?? []) {
      const parsed = parseReview(raw)
      if (parsed) found.set(parsed.id, parsed)
    }
    nextPageToken = data.serpapi_pagination?.next_page_token
    page += 1
  } while (found.size < TARGET_USABLE_REVIEWS && nextPageToken && page < MAX_PAGES)

  return Array.from(found.values())
}
