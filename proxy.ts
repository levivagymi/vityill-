import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['hu', 'en', 'de'] as const
type Locale = typeof locales[number]
const defaultLocale: Locale = 'hu'

function getLocale(request: NextRequest): Locale {
  const acceptLang = request.headers.get('accept-language')
  if (!acceptLang) return defaultLocale
  const preferred = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase()
  if (preferred && locales.includes(preferred as Locale)) return preferred as Locale
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)', '/'],
}
