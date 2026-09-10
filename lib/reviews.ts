'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { Locale } from '@/lib/types'

export type LiveReview = { id: string; name: string; rating: number; text: string }
export type ReviewsStatus = 'loading' | 'ready' | 'unavailable'

/** Fetches this business's live Google reviews from our own /api/reviews
 *  proxy (SerpApi is called server-side only - the key never reaches the
 *  client). Replaces lib/trustindex.ts's DOM-scraping integration, keeping
 *  the same { status, reviews } shape GuestStories.tsx already consumes. */
export function useLiveReviews(): { status: ReviewsStatus; reviews: LiveReview[] } {
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const [status, setStatus] = useState<ReviewsStatus>('loading')
  const [reviews, setReviews] = useState<LiveReview[]>([])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/reviews?hl=${lang}`)
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json() as Promise<{ reviews: LiveReview[] }>
      })
      .then((data) => {
        if (cancelled) return
        setReviews(Array.isArray(data.reviews) ? data.reviews : [])
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setReviews([])
        setStatus('unavailable')
      })
    return () => {
      cancelled = true
    }
  }, [lang])

  return { status, reviews }
}
