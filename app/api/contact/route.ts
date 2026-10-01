import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { sendContactNotification } from '@/lib/email'
import { checkRequestOrigin, isHoneypotFilled, readJsonBody, siteAllowedHosts } from '@/lib/api-guard'
import { localeSchema, singleLine } from '@/lib/validation'
import { CONTACT_ENABLED } from '@/lib/site'

const contactSchema = z.object({
  name: singleLine(120).pipe(z.string().min(1)),
  email: z.string().trim().pipe(z.email()),
  phone: singleLine(40).optional().default(''),
  subject: singleLine(160).optional().default(''),
  message: z.string().trim().min(1).max(4000),
  locale: localeSchema.optional(),
})

export async function POST(request: Request) {
  // Server-side gate: the disabled form alone would not stop a direct POST.
  if (!CONTACT_ENABLED) {
    return NextResponse.json({ ok: false, error: 'contact_disabled' }, { status: 503 })
  }

  const origin = checkRequestOrigin(request.headers, siteAllowedHosts())
  if (!origin.ok) return NextResponse.json({ ok: false, error: origin.error }, { status: origin.status })

  const body = await readJsonBody(request)
  if (!body.ok) return NextResponse.json({ ok: false, error: body.error }, { status: body.status })

  // Bots get the same answer a person would - no signal to tune against.
  if (isHoneypotFilled(body.value)) return NextResponse.json({ ok: true, id: randomUUID() })

  const parsed = contactSchema.safeParse(body.value)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', issues: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const record = { id: randomUUID(), receivedAt: new Date().toISOString(), ...parsed.data }
  const delivery = await sendContactNotification(record)

  if (delivery === 'failed') {
    return NextResponse.json({ ok: false, error: 'delivery_failed' }, { status: 502 })
  }
  // Locally a missing Resend key is a convenience no-op; in production it
  // would mean every message silently vanishes, so it is an error there.
  if (delivery === 'not_configured' && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'email_not_configured' }, { status: 503 })
  }
  return NextResponse.json({ ok: true, id: record.id })
}
