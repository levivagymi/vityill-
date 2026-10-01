import type { MetadataRoute } from 'next'
import { SITE_INDEXABLE, SITE_URL } from '@/lib/site'

/** Model-training / AI-answer crawlers. They do not put pages in a search
 *  index, so noindex says nothing to them - only a robots.txt block does. */
const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'CCBot',
  'Google-Extended',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'Bytespider',
  'Applebot-Extended',
  'meta-externalagent',
  'Amazonbot',
]

export default function robots(): MetadataRoute.Robots {
  if (SITE_INDEXABLE) {
    return {
      rules: { userAgent: '*', allow: '/', disallow: '/api/' },
      sitemap: `${SITE_URL}/sitemap.xml`,
    }
  }

  // Pre-launch. Search engines are deliberately still ALLOWED to crawl: the
  // noindex lives in the X-Robots-Tag header and the robots meta tag, and a
  // crawler that robots.txt shuts out never fetches the page, never sees that
  // noindex, and can still list the bare URL if something links to it.
  // No sitemap line - nothing should advertise the URL inventory yet.
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/api/' },
      { userAgent: AI_CRAWLERS, disallow: '/' },
    ],
  }
}
