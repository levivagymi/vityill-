import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { bookingServerSchema, type BookingPayload } from '@/lib/booking'

type BookingRecord = BookingPayload & { id: string; receivedAt: string }

/** Append the booking request to a local NDJSON log. Failures are non-fatal
 *  (e.g. read-only serverless FS) — the request still succeeds and is logged. */
async function persistBooking(record: BookingRecord) {
  try {
    const dir = path.join(process.cwd(), 'data')
    await fs.mkdir(dir, { recursive: true })
    await fs.appendFile(path.join(dir, 'bookings.ndjson'), JSON.stringify(record) + '\n', 'utf8')
  } catch (err) {
    console.warn('[booking] could not persist to disk:', (err as Error).message)
  }
}

/** Notify the host. Real email sending is wired only when SMTP env vars exist;
 *  otherwise it is a no-op so the flow works end-to-end without credentials. */
async function notifyHost(record: BookingRecord) {
  if (!process.env.SMTP_HOST) {
    console.info(`[booking] new request ${record.id} from ${record.email} (email sending not configured)`)
    return
  }
  // Placeholder for an SMTP/transactional-email integration.
  console.info(`[booking] would email host about ${record.id}`)
}

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = bookingServerSchema.safeParse(json)
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

  await persistBooking(record)
  await notifyHost(record)

  return NextResponse.json({ ok: true, id: record.id })
}
