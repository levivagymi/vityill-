export const TRUSTINDEX_LOADER_SRC =
  'https://cdn.trustindex.io/loader.js?c45484e807626631c386f41a430'

export type TrustindexReview = {
  id: string
  name: string
  rating: number
  maxRating: number
  timeEpoch: number
  text: string
  platform: string
}

/**
 * Parses one Trustindex `.ti-review-item` node into a structured review.
 * Returns null for rating-only reviews (`.ti-empty-text`) or nodes missing
 * a name/id/text — both are dropped rather than rendered as broken cards.
 */
export function parseReviewItem(el: Element): TrustindexReview | null {
  const id = el.getAttribute('data-id')
  const nameEl = el.querySelector('.ti-name')
  const textEl = el.querySelector('.ti-review-text-container')

  if (!id || !nameEl || !textEl) return null
  if (textEl.classList.contains('ti-empty-text')) return null

  const name = nameEl.textContent?.trim() ?? ''
  const text = textEl.textContent?.trim() ?? ''
  if (!name || !text) return null

  const rating = parseFloat(el.getAttribute('data-rating') ?? '')
  const maxRating = parseFloat(el.getAttribute('data-max-rating') ?? '')
  const timeEpoch = parseInt(el.getAttribute('data-time') ?? '', 10)

  const sourceClass = Array.from(el.classList).find((c) => c.startsWith('source-'))
  const platform = sourceClass ? sourceClass.slice('source-'.length) : 'Google'

  return {
    id,
    name,
    rating: Number.isFinite(rating) ? rating : 0,
    maxRating: Number.isFinite(maxRating) ? maxRating : 5,
    timeEpoch: Number.isFinite(timeEpoch) ? timeEpoch : 0,
    text,
    platform,
  }
}
