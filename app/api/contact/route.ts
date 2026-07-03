import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().pipe(z.email()),
  phone: z.string().trim().max(40).optional().default(''),
  subject: z.string().trim().max(160).optional().default(''),
  message: z.string().trim().min(1).max(4000),
  locale: z.string().max(5).optional(),
})

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', issues: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const record = { id: randomUUID(), receivedAt: new Date().toISOString(), ...parsed.data }
  try {
    const dir = path.join(process.cwd(), 'data')
    await fs.mkdir(dir, { recursive: true })
    await fs.appendFile(path.join(dir, 'messages.ndjson'), JSON.stringify(record) + '\n', 'utf8')
  } catch (err) {
    console.warn('[contact] could not persist to disk:', (err as Error).message)
  }
  console.info(`[contact] message ${record.id} from ${record.email}`)

  return NextResponse.json({ ok: true, id: record.id })
}
