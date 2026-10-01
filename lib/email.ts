import 'server-only'
import { Resend } from 'resend'
import hu from '@/dictionaries/hu.json'
import { calculateStayPrice, formatHUF, nightsBetween, type BookingChannel } from './booking'
import type { BookingPayload } from './booking-schema'

/**
 * Host notifications for the two public forms. Email is the ONLY place a
 * submission ends up - the site keeps no copy on disk or in a database (data
 * minimisation), so a failed send must reach the visitor as an error instead
 * of a silent "thanks".
 */

export type DeliveryResult = 'sent' | 'not_configured' | 'failed'

type ContactRecord = {
  id: string
  receivedAt: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  locale?: string
}

export type BookingRecord = BookingPayload & { id: string; receivedAt: string }

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const FOREST = '#1A4731'
const FOREST_DARK = '#123626'
const CREAM = '#FFF4CC'
const CREAM_SOFT = '#FFF9E6'

/** One detail line. `valueHtml` must already be escaped. */
type DetailRow = { icon: string; label: string; valueHtml: string }

function fieldRow({ icon, label, valueHtml }: DetailRow) {
  return `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #EDE7D3;" width="28" valign="top">
        <span style="font-size: 16px;">${icon}</span>
      </td>
      <td style="padding: 10px 0 10px 4px; border-bottom: 1px solid #EDE7D3;" valign="top">
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #8a8368; margin-bottom: 2px;">${label}</div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #22301f;">${valueHtml}</div>
      </td>
    </tr>`
}

function hungarianTimestamp(iso: string) {
  return new Date(iso).toLocaleString('hu-HU', { dateStyle: 'long', timeStyle: 'short' })
}

function emailRow(email: string): DetailRow {
  const safe = escapeHtml(email)
  return {
    icon: '✉️',
    label: 'Email',
    valueHtml: `<a href="mailto:${safe}" style="color:${FOREST}; text-decoration: none; font-weight: bold;">${safe}</a>`,
  }
}

/** The branded shell both notifications share. Every interpolated value is
 *  escaped by the caller (rows) or here (reply/footer). */
function renderNotificationEmail(opts: {
  subtitle: string
  rows: DetailRow[]
  message?: { label: string; text: string }
  replyEmail: string
  replyName: string
  footer: string
}) {
  const replyEmail = escapeHtml(opts.replyEmail)
  const replyName = escapeHtml(opts.replyName)
  const messageBlock = opts.message
    ? `
      <tr>
        <td style="padding: 20px 40px 8px;">
          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #8a8368; margin-bottom: 8px;">${opts.message.label}</div>
          <div style="background-color: ${CREAM_SOFT}; border-left: 4px solid ${FOREST}; border-radius: 10px; padding: 16px 20px; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.6; color: #2c3a26; font-style: italic;">
            “${escapeHtml(opts.message.text).replace(/\n/g, '<br />')}”
          </div>
        </td>
      </tr>`
    : ''

  return `
<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<style>
  :root { color-scheme: light only; supported-color-schemes: light only; }
  body { -webkit-text-size-adjust: 100%; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F1E6;">
  <div style="background-color: #F4F1E6; padding: 32px 16px; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 24px rgba(26,71,49,0.12);">
      <tr>
        <td bgcolor="${FOREST}" style="background-color: ${FOREST}; background-image: linear-gradient(135deg, ${FOREST} 0%, ${FOREST_DARK} 100%); padding: 36px 40px;">
          <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; color: ${CREAM} !important; font-weight: bold; letter-spacing: 0.02em;">
            🏡 <span style="color: ${CREAM} !important;">Vityilló Vendégház</span>
          </div>
          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #E8DCA8 !important; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.1em;">
            ${opts.subtitle}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding: 32px 40px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${opts.rows.map(fieldRow).join('')}
          </table>
        </td>
      </tr>${messageBlock}
      <tr>
        <td style="padding: 24px 40px 36px;" align="center">
          <a href="mailto:${replyEmail}" style="display: inline-block; background-color: ${FOREST}; color: ${CREAM}; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 13px 32px; border-radius: 999px; letter-spacing: 0.02em;">
            ↩️ Válasz ${replyName} részére
          </a>
        </td>
      </tr>
      <tr>
        <td style="background-color: #FAF8F0; padding: 18px 40px; border-top: 1px solid #EDE7D3;" align="center">
          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #a39c82;">
            ${escapeHtml(opts.footer)}
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim()
}

function footerLine(id: string, receivedAt: string, locale: string | undefined, nice: boolean) {
  const when = nice ? hungarianTimestamp(receivedAt) : receivedAt
  return `Azonosító: ${id} · Beérkezett: ${when}${locale ? ` · Nyelv: ${locale.toUpperCase()}` : ''}`
}

function buildContactEmail(record: ContactRecord) {
  const rows: DetailRow[] = [
    { icon: '👤', label: 'Név', valueHtml: escapeHtml(record.name) },
    emailRow(record.email),
    ...(record.phone ? [{ icon: '📞', label: 'Telefon', valueHtml: escapeHtml(record.phone) }] : []),
    ...(record.subject ? [{ icon: '🏷️', label: 'Tárgy', valueHtml: escapeHtml(record.subject) }] : []),
  ]

  const html = renderNotificationEmail({
    subtitle: '📩 Új üzenet érkezett a honlapról',
    rows,
    message: { label: '💬 Üzenet', text: record.message },
    replyEmail: record.email,
    replyName: record.name,
    footer: footerLine(record.id, record.receivedAt, record.locale, true),
  })

  const text = [
    'Új üzenet a honlap kapcsolatfelvételi űrlapjáról',
    '',
    `Név: ${record.name}`,
    `Email: ${record.email}`,
    record.phone ? `Telefon: ${record.phone}` : null,
    record.subject ? `Tárgy: ${record.subject}` : null,
    '',
    'Üzenet:',
    record.message,
    '',
    footerLine(record.id, record.receivedAt, record.locale, false),
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

  return { html, text }
}

const CHANNEL_LABELS: Record<BookingChannel, string> = {
  direct: hu.booking.channelDirect,
  airbnb: hu.booking.channelAirbnb,
  booking: hu.booking.channelBooking,
  facebook: hu.booking.channelFacebook,
  other: hu.booking.channelOther,
}

function buildBookingEmail(record: BookingRecord) {
  const nights = nightsBetween(record.checkIn, record.checkOut)
  const estimate = calculateStayPrice(record)
  const guests = `${record.adults} felnőtt · ${record.childrenUnder4} gyermek (0–3 év) · ${record.childrenOver4} gyermek (4+ év)`
  const stay = `${record.checkIn} → ${record.checkOut} (${nights} éj)`
  const price = `${formatHUF(estimate.total, 'hu')} (becsült, IFA nélkül)`
  const channel = record.channel ? CHANNEL_LABELS[record.channel] : null

  const rows: DetailRow[] = [
    { icon: '👤', label: 'Név', valueHtml: escapeHtml(record.name) },
    emailRow(record.email),
    { icon: '📞', label: 'Telefon', valueHtml: escapeHtml(record.phone) },
    { icon: '📅', label: 'Tartózkodás', valueHtml: escapeHtml(stay) },
    { icon: '👥', label: 'Vendégek', valueHtml: escapeHtml(guests) },
    { icon: '💰', label: 'Becsült ár', valueHtml: escapeHtml(price) },
    ...(channel ? [{ icon: '🔎', label: 'Honnan talált ránk', valueHtml: escapeHtml(channel) }] : []),
  ]

  const html = renderNotificationEmail({
    subtitle: '🗓️ Új foglalási kérés érkezett',
    rows,
    message: record.requests ? { label: '📝 Különleges kérések', text: record.requests } : undefined,
    replyEmail: record.email,
    replyName: record.name,
    footer: footerLine(record.id, record.receivedAt, record.locale, true),
  })

  const text = [
    'Új foglalási kérés a honlapról',
    '',
    `Név: ${record.name}`,
    `Email: ${record.email}`,
    `Telefon: ${record.phone}`,
    `Tartózkodás: ${stay}`,
    `Vendégek: ${guests}`,
    `Becsült ár: ${price}`,
    channel ? `Honnan talált ránk: ${channel}` : null,
    record.requests ? '' : null,
    record.requests ? 'Különleges kérések:' : null,
    record.requests || null,
    '',
    footerLine(record.id, record.receivedAt, record.locale, false),
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

  return { html, text }
}

/** Shared send path. Logs carry the submission id only - never the guest's
 *  name or address (server logs are kept by the host for days to weeks). */
async function deliver(
  kind: 'contact' | 'booking',
  id: string,
  mail: { subject: string; replyTo: string; html: string; text: string },
): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_EMAIL_TO
  if (!apiKey || !to) {
    console.info(`[${kind}] ${id} received (email sending not configured)`)
    return 'not_configured'
  }

  const from = process.env.CONTACT_EMAIL_FROM || 'Vityilló Weboldal <onboarding@resend.dev>'

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({ from, to, ...mail })
    if (error) {
      console.error(`[${kind}] ${id} rejected by Resend: ${error.name} - ${error.message}`)
      return 'failed'
    }
    console.info(`[${kind}] ${id} delivered`)
    return 'sent'
  } catch (err) {
    console.error(`[${kind}] ${id} send failed: ${(err as Error).message}`)
    return 'failed'
  }
}

/** Email the host about a new contact-form submission. */
export function sendContactNotification(record: ContactRecord): Promise<DeliveryResult> {
  const { html, text } = buildContactEmail(record)
  return deliver('contact', record.id, {
    subject: `Új üzenet a honlapról – ${record.subject?.trim() || record.name}`,
    replyTo: record.email,
    html,
    text,
  })
}

/** Email the host about a new booking request. */
export function sendBookingNotification(record: BookingRecord): Promise<DeliveryResult> {
  const { html, text } = buildBookingEmail(record)
  return deliver('booking', record.id, {
    subject: `Új foglalási kérés – ${record.name}, ${record.checkIn} → ${record.checkOut}`,
    replyTo: record.email,
    html,
    text,
  })
}
