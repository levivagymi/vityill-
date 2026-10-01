/** Canonical production origin - metadataBase, robots.txt and sitemap.xml. */
export const SITE_URL = 'https://vityillo.hu'

/**
 * Search-engine indexing switch. Off unless SITE_INDEXABLE is exactly "true",
 * so a forgotten or misspelt variable fails closed (noindex), never open.
 *
 * Read at BUILD time - by next.config.ts headers(), app/robots.ts,
 * app/sitemap.ts and the root layout's metadata, all of which are frozen into
 * the build output. Changing the variable on Vercel has no effect until the
 * project is redeployed.
 */
export const SITE_INDEXABLE = process.env.SITE_INDEXABLE === 'true'

/** Set to true when the contact form may deliver messages to the owner.
 *  While false, /api/contact answers 503 and the form renders disabled with
 *  the phone/email alternatives. Its booking counterpart is BOOKING_ENABLED
 *  in lib/booking.ts. */
export const CONTACT_ENABLED = false
