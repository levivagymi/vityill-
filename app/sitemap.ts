import type { MetadataRoute } from 'next'
import { ROUTES, ROOM_SLUGS } from '@/lib/nav'

const BASE = 'https://vityillo.hu'
const LOCALES = ['hu', 'en', 'de'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const paths: string[] = [
    '',
    ROUTES.rooms,
    ...ROOM_SLUGS.map((s) => `${ROUTES.rooms}/${s}`),
    ROUTES.experiences,
    ROUTES.gallery,
    ROUTES.contact,
    ROUTES.booking,
    ROUTES.imprint,
    ROUTES.privacy,
    ROUTES.terms,
  ]

  const now = new Date()
  return LOCALES.flatMap((lang) =>
    paths.map((p) => ({
      url: p ? `${BASE}/${lang}/${p}` : `${BASE}/${lang}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: p === '' ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, p ? `${BASE}/${l}/${p}` : `${BASE}/${l}`])
        ),
      },
    }))
  )
}
