import { Resend } from 'resend'

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

function fieldRow(icon: string, label: string, value: string) {
  return `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #EDE7D3;" width="28" valign="top">
        <span style="font-size: 16px;">${icon}</span>
      </td>
      <td style="padding: 10px 0 10px 4px; border-bottom: 1px solid #EDE7D3;" valign="top">
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #8a8368; margin-bottom: 2px;">${label}</div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #22301f;">${value}</div>
      </td>
    </tr>`
}

function buildContactEmail(record: ContactRecord) {
  const name = escapeHtml(record.name)
  const email = escapeHtml(record.email)
  const phone = record.phone ? escapeHtml(record.phone) : ''
  const subject = record.subject ? escapeHtml(record.subject) : ''
  const message = escapeHtml(record.message).replace(/\n/g, '<br />')
  const receivedNice = new Date(record.receivedAt).toLocaleString('hu-HU', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
  const replyHref = `mailto:${email}`

  const rows = [
    fieldRow('👤', 'Név', name),
    fieldRow('✉️', 'Email', `<a href="mailto:${email}" style="color:${FOREST}; text-decoration: none; font-weight: bold;">${email}</a>`),
    phone ? fieldRow('📞', 'Telefon', phone) : '',
    subject ? fieldRow('🏷️', 'Tárgy', subject) : '',
  ].join('')

  const html = `
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
            📩 Új üzenet érkezett a honlapról
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding: 32px 40px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 40px 8px;">
          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #8a8368; margin-bottom: 8px;">💬 Üzenet</div>
          <div style="background-color: ${CREAM_SOFT}; border-left: 4px solid ${FOREST}; border-radius: 10px; padding: 16px 20px; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.6; color: #2c3a26; font-style: italic;">
            “${message}”
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px 40px 36px;" align="center">
          <a href="${replyHref}" style="display: inline-block; background-color: ${FOREST}; color: ${CREAM}; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 13px 32px; border-radius: 999px; letter-spacing: 0.02em;">
            ↩️ Válasz ${name} részére
          </a>
        </td>
      </tr>
      <tr>
        <td style="background-color: #FAF8F0; padding: 18px 40px; border-top: 1px solid #EDE7D3;" align="center">
          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #a39c82;">
            Azonosító: ${record.id} · Beérkezett: ${receivedNice}${record.locale ? ` · Nyelv: ${record.locale.toUpperCase()}` : ''}
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim()

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
    `Azonosító: ${record.id} · Beérkezett: ${record.receivedAt}${record.locale ? ` · Nyelv: ${record.locale}` : ''}`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

  return { html, text }
}

/** Email the host about a new contact-form submission. Real sending is wired
 *  only when Resend env vars exist; otherwise it is a non-fatal no-op so the
 *  flow works end-to-end without credentials (mirrors booking's notifyHost). */
export async function sendContactNotification(record: ContactRecord) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_EMAIL_TO
  if (!apiKey || !to) {
    console.info(`[contact] new message ${record.id} from ${record.email} (email sending not configured)`)
    return
  }

  const from = process.env.CONTACT_EMAIL_FROM || 'Vityilló Weboldal <onboarding@resend.dev>'
  const { html, text } = buildContactEmail(record)

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: record.email,
      subject: `Új üzenet a honlapról – ${record.subject?.trim() || record.name}`,
      html,
      text,
    })
    if (error) {
      console.error('[contact] Resend rejected the email:', error)
    }
  } catch (err) {
    console.error('[contact] failed to send notification email:', (err as Error).message)
  }
}
