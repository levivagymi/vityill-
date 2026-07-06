import type { Locale } from '@/lib/types'
import type { AmenityKey } from '@/lib/content'

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

/** Immersive experience subpage slugs under /elmenyek. The marquee three
 *  lead — their order drives the index page rows and the related-chip ring. */
export const EXPERIENCE_SLUGS = ['jacuzzi', 'sauna', 'bograc', 'erdo', 'vilagitas', 'kilatas', 'klima', 'tv', 'konyha'] as const
export type ExperienceSlug = (typeof EXPERIENCE_SLUGS)[number]

export const experienceHref = (lang: Locale, slug: ExperienceSlug): string =>
  `/${lang}/${ROUTES.experiences}/${slug}`

/** Maps a homepage amenity card to its immersive experience subpage. */
export const EXPERIENCE_SLUG_BY_AMENITY: Record<AmenityKey, ExperienceSlug> = {
  sauna: 'sauna', pool: 'jacuzzi', grill: 'bograc', forest: 'erdo',
  lighting: 'vilagitas', view: 'kilatas', ac: 'klima', tv: 'tv', kitchen: 'konyha',
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
