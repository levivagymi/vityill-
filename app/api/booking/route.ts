import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { BOOKING_ENABLED } from '@/lib/booking'
import { bookingServerSchema } from '@/lib/booking-schema'
import { sendBookingNotification, type BookingRecord } from '@/lib/email'
import { checkRequestOrigin, isHoneypotFilled, readJsonBody, siteAllowedHosts } from '@/lib/api-guard'

export async function POST(request: Request) {
  if (!BOOKING_ENABLED) {
    return NextResponse.json({ ok: false, error: 'booking_disabled' }, { status: 503 })
  }

  const origin = checkRequestOrigin(request.headers, siteAllowedHosts())
  if (!origin.ok) return NextResponse.json({ ok: false, error: origin.error }, { status: origin.status })

  const body = await readJsonBody(request)
  if (!body.ok) return NextResponse.json({ ok: false, error: body.error }, { status: body.status })

  // Bots get the same answer a person would - no signal to tune against.
  if (isHoneypotFilled(body.value)) return NextResponse.json({ ok: true, id: randomUUID() })

  const parsed = bookingServerSchema.safeParse(body.value)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', issues: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const record: BookingRecord = {
    id: randomUUID(),
    receivedAt: new Date().toISOString(),
    ...parsed.data,
  }
  const delivery = await sendBookingNotification(record)

  if (delivery === 'failed') {
    return NextResponse.json({ ok: false, error: 'delivery_failed' }, { status: 502 })
  }
  // Locally a missing Resend key is a convenience no-op; in production it
  // would mean every request silently vanishes, so it is an error there.
  if (delivery === 'not_configured' && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'email_not_configured' }, { status: 503 })
  }
  return NextResponse.json({ ok: true, id: record.id })
}
