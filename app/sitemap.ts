import type { MetadataRoute } from 'next'
import { notFound } from 'next/navigation'
import { ROUTES, ROOM_SLUGS, EXPERIENCE_SLUGS } from '@/lib/nav'
import { SITE_INDEXABLE, SITE_URL as BASE } from '@/lib/site'

const LOCALES = ['hu', 'en', 'de'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  // Pre-launch: a clean 404 rather than an empty <urlset> - there is no URL
  // inventory to advertise until the site is opened to search engines.
  if (!SITE_INDEXABLE) notFound()

  const paths: string[] = [
    '',
    ROUTES.rooms,
    ...ROOM_SLUGS.map((s) => `${ROUTES.rooms}/${s}`),
    ROUTES.experiences,
    ...EXPERIENCE_SLUGS.map((s) => `${ROUTES.experiences}/${s}`),
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
