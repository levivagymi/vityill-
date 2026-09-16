'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { Locale } from '@/lib/types'

export type LiveReview = { id: string; name: string; rating: number; text: string }
export type ReviewsStatus = 'loading' | 'ready' | 'unavailable'
type ReviewsApiResponse = { reviews: LiveReview[]; totalCount: number | null; avgRating: number | null }

/** Fetches this business's live Google reviews from our own /api/reviews
 *  proxy (SerpApi is called server-side only - the key never reaches the
 *  client). Replaces lib/trustindex.ts's DOM-scraping integration, keeping
 *  the same { status, reviews } shape GuestStories.tsx already consumes.
 *  totalCount/avgRating are the place's true stats across ALL of Google's
 *  reviews (not just the handful in `reviews`) - null while loading/unavailable
 *  or if SerpApi didn't report them. */
export function useLiveReviews(): {
  status: ReviewsStatus
  reviews: LiveReview[]
  totalCount: number | null
  avgRating: number | null
} {
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const [status, setStatus] = useState<ReviewsStatus>('loading')
  const [reviews, setReviews] = useState<LiveReview[]>([])
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [avgRating, setAvgRating] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/reviews?hl=${lang}`)
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json() as Promise<ReviewsApiResponse>
      })
      .then((data) => {
        if (cancelled) return
        setReviews(Array.isArray(data.reviews) ? data.reviews : [])
        setTotalCount(typeof data.totalCount === 'number' ? data.totalCount : null)
        setAvgRating(typeof data.avgRating === 'number' ? data.avgRating : null)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setReviews([])
        setTotalCount(null)
        setAvgRating(null)
        setStatus('unavailable')
      })
    return () => {
      cancelled = true
    }
  }, [lang])

  return { status, reviews, totalCount, avgRating }
}
