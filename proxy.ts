import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['hu', 'en', 'de'] as const
type Locale = typeof locales[number]
const defaultLocale: Locale = 'hu'

function getLocale(request: NextRequest): Locale {
  const acceptLang = request.headers.get('accept-language')
  if (!acceptLang) return defaultLocale
  // Walk the whole preference list ("fr, de;q=0.9, en;q=0.8"), not just the
  // first entry, so any supported language wins before the default applies.
  for (const part of acceptLang.split(',')) {
    const code = part.split(';')[0]?.trim().split('-')[0]?.toLowerCase()
    if (code && locales.includes(code as Locale)) return code as Locale
  }
  return defaultLocale
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  if (hasLocale) return NextResponse.next()
  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)', '/'],
}
