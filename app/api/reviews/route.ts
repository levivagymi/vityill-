import { NextRequest, NextResponse } from 'next/server'
import { fetchGoogleReviews } from '@/lib/serpapi'
import type { Locale } from '@/lib/types'

const SUPPORTED_LOCALES: readonly Locale[] = ['hu', 'en', 'de']

function toLocale(value: string | null): Locale {
  return value && (SUPPORTED_LOCALES as readonly string[]).includes(value) ? (value as Locale) : 'hu'
}

export async function GET(request: NextRequest) {
  const hl = toLocale(request.nextUrl.searchParams.get('hl'))
  const reviews = await fetchGoogleReviews(hl)
  return NextResponse.json(
    { reviews },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400' } },
  )
}
