import type { Locale } from '@/lib/types'

/** Route slugs are the same across locales for simplicity and clean URLs. */
export const ROUTES = {
  home: '',
  rooms: 'szobak',
  experiences: 'elmenyek',
  gallery: 'galeria',
  contact: 'kapcsolat',
  booking: 'foglalas',
  imprint: 'impresszum',
  privacy: 'adatvedelem',
  terms: 'aszf',
} as const

export type RouteKey = keyof typeof ROUTES

/** Build a localized href for a route key. */
export const href = (lang: Locale, key: RouteKey): string => {
  const slug = ROUTES[key]
  return slug ? `/${lang}/${slug}` : `/${lang}`
}

/** Rewrite the locale segment of the current pathname, keeping the rest of the URL. */
export const switchLocalePath = (pathname: string | null, next: Locale): string => {
  if (!pathname) return `/${next}`
  const segments = pathname.split('/')
  segments[1] = next
  return segments.join('/') || `/${next}`
}

/** Room detail slugs. */
export const ROOM_SLUGS = ['felso-szint', 'also-szint'] as const
export type RoomSlug = (typeof ROOM_SLUGS)[number]

export const roomHref = (lang: Locale, slug: RoomSlug): string =>
  `/${lang}/${ROUTES.rooms}/${slug}`

/** Maps a room URL slug to its dictionary key. */
export const ROOM_KEY_BY_SLUG: Record<RoomSlug, 'room1' | 'room2'> = {
  'felso-szint': 'room1',
  'also-szint': 'room2',
}

/** Primary navigation shown in the navbar and footer. dictKey points into dict.nav. */
export const MAIN_NAV: {
  dictKey: 'about' | 'rooms' | 'experiences' | 'gallery' | 'contact'
  key: RouteKey
  hash?: string
}[] = [
  { dictKey: 'about', key: 'home', hash: 'rolunk' },
  { dictKey: 'rooms', key: 'rooms' },
  { dictKey: 'experiences', key: 'experiences' },
  { dictKey: 'gallery', key: 'gallery' },
  { dictKey: 'contact', key: 'contact' },
]
