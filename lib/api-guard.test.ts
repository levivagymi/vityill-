import { describe, expect, it } from 'vitest'
import {
  MAX_JSON_BODY_BYTES,
  checkRequestOrigin,
  isHoneypotFilled,
  readJsonBody,
  siteAllowedHosts,
} from './api-guard'

const ALLOWED = ['vityillo.hu', 'www.vityillo.hu']

function headers(init: Record<string, string>) {
  return new Headers(init)
}

describe('checkRequestOrigin', () => {
  it('rejects anything the browser marks cross-site, whatever the Origin says', () => {
    const result = checkRequestOrigin(
      headers({ host: 'vityillo.hu', origin: 'https://vityillo.hu', 'sec-fetch-site': 'cross-site' }),
      ALLOWED,
    )
    expect(result).toEqual({ ok: false, status: 403, error: 'cross_site' })
  })

  it('accepts an Origin matching the request Host, including the port', () => {
    const result = checkRequestOrigin(
      headers({ host: 'localhost:3100', origin: 'http://localhost:3100', 'sec-fetch-site': 'same-origin' }),
      ALLOWED,
    )
    expect(result).toEqual({ ok: true })
  })

  it('accepts the www <-> apex pair through the allowlist', () => {
    const result = checkRequestOrigin(
      headers({ host: 'vityillo.hu', origin: 'https://www.vityillo.hu', 'sec-fetch-site': 'same-site' }),
      ALLOWED,
    )
    expect(result).toEqual({ ok: true })
  })

  it('accepts an Origin matching x-forwarded-host behind a proxy', () => {
    const result = checkRequestOrigin(
      headers({ host: 'internal:8080', 'x-forwarded-host': 'preview.example.app', origin: 'https://preview.example.app' }),
      ALLOWED,
    )
    expect(result).toEqual({ ok: true })
  })

  it('rejects a foreign Origin', () => {
    const result = checkRequestOrigin(headers({ host: 'vityillo.hu', origin: 'https://evil.example' }), ALLOWED)
    expect(result).toEqual({ ok: false, status: 403, error: 'origin_mismatch' })
  })

  it('rejects the opaque "null" Origin', () => {
    const result = checkRequestOrigin(headers({ host: 'vityillo.hu', origin: 'null' }), ALLOWED)
    expect(result).toEqual({ ok: false, status: 403, error: 'origin_mismatch' })
  })

  it('falls back to a matching Referer when Origin is missing', () => {
    const result = checkRequestOrigin(
      headers({ host: 'vityillo.hu', referer: 'https://vityillo.hu/hu/kapcsolat' }),
      ALLOWED,
    )
    expect(result).toEqual({ ok: true })
  })

  it('rejects a foreign Referer when Origin is missing', () => {
    const result = checkRequestOrigin(
      headers({ host: 'vityillo.hu', referer: 'https://evil.example/form' }),
      ALLOWED,
    )
    expect(result).toEqual({ ok: false, status: 403, error: 'referer_mismatch' })
  })

  it('lets a request with neither header through (honeypot takes over)', () => {
    expect(checkRequestOrigin(headers({ host: 'vityillo.hu' }), ALLOWED)).toEqual({ ok: true })
  })
})

describe('siteAllowedHosts', () => {
  it('always includes apex and www, plus whichever Vercel URLs are set', () => {
    expect(siteAllowedHosts({})).toEqual(['vityillo.hu', 'www.vityillo.hu'])
    expect(
      siteAllowedHosts({ VERCEL_URL: 'vityillo-abc.vercel.app', VERCEL_BRANCH_URL: undefined }),
    ).toEqual(['vityillo.hu', 'www.vityillo.hu', 'vityillo-abc.vercel.app'])
  })
})

describe('readJsonBody', () => {
  const post = (body: string, contentType = 'application/json', extra: Record<string, string> = {}) =>
    new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': contentType, ...extra },
      body,
    })

  it('parses a valid JSON body', async () => {
    expect(await readJsonBody(post('{"name":"Eszter"}'))).toEqual({ ok: true, value: { name: 'Eszter' } })
  })

  it('accepts a charset parameter on the content type', async () => {
    const result = await readJsonBody(post('{}', 'application/json; charset=utf-8'))
    expect(result.ok).toBe(true)
  })

  it('rejects other content types with 415', async () => {
    expect(await readJsonBody(post('name=x', 'application/x-www-form-urlencoded'))).toEqual({
      ok: false,
      status: 415,
      error: 'unsupported_media_type',
    })
    expect((await readJsonBody(post('{}', 'application/jsonp'))).ok).toBe(false)
  })

  it('rejects an oversized body with 413 even without a Content-Length', async () => {
    const big = JSON.stringify({ message: 'x'.repeat(MAX_JSON_BODY_BYTES) })
    expect(await readJsonBody(post(big))).toEqual({ ok: false, status: 413, error: 'payload_too_large' })
  })

  it('rejects a declared Content-Length over the cap before reading', async () => {
    const result = await readJsonBody(post('{}', 'application/json', { 'content-length': String(MAX_JSON_BODY_BYTES + 1) }))
    expect(result).toEqual({ ok: false, status: 413, error: 'payload_too_large' })
  })

  it('counts bytes, not characters', async () => {
    // 'ő' is two bytes in UTF-8: half the cap in characters is the full cap in bytes.
    const body = JSON.stringify({ m: 'ő'.repeat(MAX_JSON_BODY_BYTES / 2) })
    expect((await readJsonBody(post(body))).ok).toBe(false)
  })

  it('rejects malformed JSON with 400', async () => {
    expect(await readJsonBody(post('{"name":'))).toEqual({ ok: false, status: 400, error: 'invalid_json' })
  })
})

describe('isHoneypotFilled', () => {
  it('is false for people: field absent, empty or whitespace', () => {
    expect(isHoneypotFilled({ name: 'x' })).toBe(false)
    expect(isHoneypotFilled({ website: '' })).toBe(false)
    expect(isHoneypotFilled({ website: '   ' })).toBe(false)
    expect(isHoneypotFilled({ website: null })).toBe(false)
  })

  it('is true when anything was put in the trap', () => {
    expect(isHoneypotFilled({ website: 'https://spam.example' })).toBe(true)
    expect(isHoneypotFilled({ website: 1 })).toBe(true)
  })

  it('is false for non-object bodies (schema validation rejects those)', () => {
    expect(isHoneypotFilled(null)).toBe(false)
    expect(isHoneypotFilled('website')).toBe(false)
  })
})
