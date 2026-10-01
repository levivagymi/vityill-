import { z } from 'zod'

/**
 * Shared zod building blocks for the API route schemas (server-only use -
 * client bundles build their own localized schemas).
 */

/** A trimmed, length-capped string with CR/LF folded to a space. For values
 *  that land in an email subject or any other single-line position, where a
 *  raw newline could start a new header line. */
export const singleLine = (max: number) =>
  z.string().trim().max(max).transform((s) => s.replace(/[\r\n]+/g, ' '))

export const localeSchema = z.enum(['hu', 'en', 'de'])
