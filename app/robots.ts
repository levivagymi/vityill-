import type { MetadataRoute } from 'next'

const BASE = 'https://vityillo.hu'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${BASE}/sitemap.xml`,
  }
}
