import { describe, expect, it } from 'vitest'
import { createSnapshotReader, hasExternalConsent, parseConsent, serializeConsent } from './consent'

describe('parseConsent', () => {
  it('treats a missing value as undecided', () => {
    expect(parseConsent(null)).toEqual({ status: 'undecided' })
  })

  it('round-trips a stored decision', () => {
    const at = new Date('2026-10-01T12:00:00.000Z')
    expect(parseConsent(serializeConsent(true, at))).toEqual({
      status: 'decided',
      external: true,
      decidedAt: '2026-10-01T12:00:00.000Z',
    })
    expect(parseConsent(serializeConsent(false, at))).toMatchObject({ status: 'decided', external: false })
  })

  it('never reads corrupt or foreign data as a yes', () => {
    expect(parseConsent('{not json')).toEqual({ status: 'undecided' })
    expect(parseConsent('null')).toEqual({ status: 'undecided' })
    expect(parseConsent('true')).toEqual({ status: 'undecided' })
    expect(parseConsent('{"v":1,"external":"yes","decidedAt":"x"}')).toEqual({ status: 'undecided' })
    expect(parseConsent('{"v":1,"external":true}')).toEqual({ status: 'undecided' })
  })

  it('discards a record written by another schema version', () => {
    expect(parseConsent('{"v":2,"external":true,"decidedAt":"2026-10-01T12:00:00.000Z"}')).toEqual({
      status: 'undecided',
    })
  })

  it('ignores the legacy banner value, so those visitors are asked again', () => {
    expect(parseConsent('accepted')).toEqual({ status: 'undecided' })
    expect(parseConsent('declined')).toEqual({ status: 'undecided' })
  })
})

describe('hasExternalConsent', () => {
  it('is true only for an explicit, stored yes', () => {
    expect(hasExternalConsent({ status: 'unknown' })).toBe(false)
    expect(hasExternalConsent({ status: 'undecided' })).toBe(false)
    expect(hasExternalConsent({ status: 'decided', external: false, decidedAt: '' })).toBe(false)
    expect(hasExternalConsent({ status: 'decided', external: true, decidedAt: '' })).toBe(true)
  })
})

describe('createSnapshotReader', () => {
  it('returns the identical object while the stored value is unchanged', () => {
    let raw: string | null = serializeConsent(true, new Date('2026-10-01T12:00:00.000Z'))
    const read = createSnapshotReader(() => raw)
    const first = read()
    expect(read()).toBe(first)

    raw = serializeConsent(false, new Date('2026-10-01T12:00:00.000Z'))
    const second = read()
    expect(second).not.toBe(first)
    expect(second).toMatchObject({ status: 'decided', external: false })
    expect(read()).toBe(second)
  })

  it('is stable for "nothing stored" too', () => {
    const read = createSnapshotReader(() => null)
    expect(read()).toBe(read())
  })
})
