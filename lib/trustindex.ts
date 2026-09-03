import { useEffect, useState } from 'react'

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

const HIDDEN_CONTAINER_ID = 'trustindex-hidden-mount'
const SETTLE_QUIET_MS = 600
const SETTLE_MAX_MS = 8000

export type TrustindexStatus = 'loading' | 'ready' | 'unavailable'

/**
 * Injects the Trustindex widget into a hidden container, watches it with a
 * MutationObserver, and returns the reviews it renders once the DOM settles
 * (600ms of quiet, or an 8s hard ceiling). The observer disconnects once
 * settled; the injected script/container are left in place (this section
 * doesn't unmount during normal navigation, and tearing down a third-party
 * loader mid-flight risks console errors from its own internal callbacks).
 */
export function useTrustindexReviews(): { status: TrustindexStatus; reviews: TrustindexReview[] } {
  const [status, setStatus] = useState<TrustindexStatus>('loading')
  const [reviews, setReviews] = useState<TrustindexReview[]>([])

  useEffect(() => {
    let container = document.getElementById(HIDDEN_CONTAINER_ID)
    const alreadyInjected =
      !!container || !!document.querySelector('script[src*="trustindex.io/loader.js"]')

    if (!alreadyInjected) {
      container = document.createElement('div')
      container.id = HIDDEN_CONTAINER_ID
      container.hidden = true
      container.style.display = 'none'
      const script = document.createElement('script')
      script.src = TRUSTINDEX_LOADER_SRC
      script.defer = true
      script.async = true
      container.appendChild(script)
      document.body.appendChild(container)
    }

    const target: Element = container ?? document.body
    const found = new Map<string, TrustindexReview>()
    let settled = false
    let quietTimer: ReturnType<typeof setTimeout> | undefined

    const settle = () => {
      if (settled) return
      settled = true
      observer.disconnect()
      clearTimeout(quietTimer)
      clearTimeout(maxTimer)
      setReviews(Array.from(found.values()))
      setStatus(found.size > 0 ? 'ready' : 'unavailable')
    }

    const scan = () => {
      target.querySelectorAll('.ti-review-item').forEach((el) => {
        const parsed = parseReviewItem(el)
        if (parsed) found.set(parsed.id, parsed)
      })
      clearTimeout(quietTimer)
      quietTimer = setTimeout(settle, SETTLE_QUIET_MS)
    }

    const observer = new MutationObserver(scan)
    observer.observe(target, { childList: true, subtree: true })
    scan()

    const maxTimer = setTimeout(settle, SETTLE_MAX_MS)

    return () => {
      observer.disconnect()
      clearTimeout(quietTimer)
      clearTimeout(maxTimer)
    }
  }, [])

  return { status, reviews }
}
