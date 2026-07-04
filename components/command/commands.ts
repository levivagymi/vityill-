import type { LucideIcon } from 'lucide-react'
import {
  BedDouble, CalendarCheck, CookingPot, Flame, Home, Images,
  Landmark, Languages, Mail, MapPin, MessageSquareQuote, Sparkles,
  SunMoon, Waves,
} from 'lucide-react'
import {
  MAIN_NAV, ROOM_SLUGS, ROOM_KEY_BY_SLUG, EXPERIENCE_SLUGS,
  href, roomHref, experienceHref, switchLocalePath,
} from '@/lib/nav'
import type { Dictionary, Locale } from '@/lib/types'

export type CommandGroup = 'nav' | 'action' | 'lang'

/** Everything a command may do — injected by the palette so the registry
 *  stays a plain data module with no hook dependencies. */
export type CommandCtx = {
  push: (target: string) => void
  toggleTheme: () => void
  /** Smooth-scrolls on the homepage, otherwise navigates to /[lang]#hash. */
  jumpTo: (hash: string) => void
}

export type Command = {
  id: string
  group: CommandGroup
  icon: LucideIcon
  label: string
  hint?: string
  keywords: string[]
  run: (ctx: CommandCtx) => void
}

const NAV_ICONS: Record<string, LucideIcon> = {
  about: Home,
  rooms: BedDouble,
  experiences: Sparkles,
  gallery: Images,
  contact: Mail,
}

const EXPERIENCE_ICONS: Record<(typeof EXPERIENCE_SLUGS)[number], LucideIcon> = {
  jacuzzi: Waves,
  sauna: Flame,
  bograc: CookingPot,
}

const SECTION_JUMPS: { hash: string; dictKey: 'about' | 'amenities' | 'rooms' | 'gallery' | 'location' }[] = [
  { hash: 'rolunk', dictKey: 'about' },
  { hash: 'amenities', dictKey: 'amenities' },
  { hash: 'rooms', dictKey: 'rooms' },
  { hash: 'gallery', dictKey: 'gallery' },
  { hash: 'location', dictKey: 'location' },
]

const LANG_LABELS: Record<Locale, string> = { hu: 'Magyar', en: 'English', de: 'Deutsch' }

export function buildCommands(dict: Dictionary, lang: Locale, pathname: string | null): Command[] {
  const commands: Command[] = []

  // Navigate — main nav, room details, experience subpages, legal pages
  for (const { dictKey, key, hash } of MAIN_NAV) {
    commands.push({
      id: `nav-${dictKey}`,
      group: 'nav',
      icon: NAV_ICONS[dictKey] ?? Home,
      label: dict.nav[dictKey],
      keywords: [dictKey, key],
      run: (ctx) =>
        hash ? ctx.jumpTo(hash) : ctx.push(href(lang, key)),
    })
  }

  for (const slug of ROOM_SLUGS) {
    const room = dict.rooms[ROOM_KEY_BY_SLUG[slug]]
    commands.push({
      id: `room-${slug}`,
      group: 'nav',
      icon: BedDouble,
      label: `${room.name} — ${room.tagline}`,
      keywords: [slug, 'room', 'szoba', 'zimmer'],
      run: (ctx) => ctx.push(roomHref(lang, slug)),
    })
  }

  for (const slug of EXPERIENCE_SLUGS) {
    const exp = dict.experiences[slug]
    commands.push({
      id: `exp-${slug}`,
      group: 'nav',
      icon: EXPERIENCE_ICONS[slug],
      label: exp.title,
      hint: exp.eyebrow,
      keywords: [slug, 'experience', 'elmeny', 'erlebnis'],
      run: (ctx) => ctx.push(experienceHref(lang, slug)),
    })
  }

  commands.push({
    id: 'nav-imprint',
    group: 'nav',
    icon: Landmark,
    label: dict.legal.imprint.title,
    keywords: ['imprint', 'impresszum', 'impressum', 'legal'],
    run: (ctx) => ctx.push(href(lang, 'imprint')),
  })

  // Actions
  commands.push({
    id: 'action-book',
    group: 'action',
    icon: CalendarCheck,
    label: dict.command.bookNow,
    keywords: ['book', 'foglalas', 'buchen', 'reservation'],
    run: (ctx) => ctx.push(href(lang, 'booking')),
  })
  commands.push({
    id: 'action-theme',
    group: 'action',
    icon: SunMoon,
    label: dict.command.toggleTheme,
    keywords: ['theme', 'dark', 'light', 'tema', 'sotet', 'vilagos', 'modus'],
    run: (ctx) => ctx.toggleTheme(),
  })
  commands.push({
    id: 'action-reviews',
    group: 'action',
    icon: MessageSquareQuote,
    label: `${dict.command.jumpPrefix}${dict.testimonials.title}`,
    keywords: ['reviews', 'velemeny', 'bewertung', 'testimonials'],
    run: (ctx) => ctx.jumpTo('testimonials'),
  })
  for (const { hash, dictKey } of SECTION_JUMPS) {
    commands.push({
      id: `jump-${hash}`,
      group: 'action',
      icon: MapPin,
      label: `${dict.command.jumpPrefix}${dict.nav[dictKey]}`,
      keywords: [hash, dictKey, 'jump', 'section'],
      run: (ctx) => ctx.jumpTo(hash),
    })
  }

  // Languages
  for (const l of ['hu', 'en', 'de'] as Locale[]) {
    if (l === lang) continue
    commands.push({
      id: `lang-${l}`,
      group: 'lang',
      icon: Languages,
      label: LANG_LABELS[l],
      hint: l.toUpperCase(),
      keywords: ['language', 'nyelv', 'sprache', l],
      run: (ctx) => ctx.push(switchLocalePath(pathname, l)),
    })
  }

  return commands
}

// ── Tiny fuzzy matcher ────────────────────────────────────────────────────────

const deaccent = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/**
 * Subsequence match with word-start and adjacency bonuses.
 * Returns 0 when the query is not a subsequence of the text.
 */
export function fuzzyScore(query: string, text: string): number {
  const q = deaccent(query)
  const t = deaccent(text)
  if (!q) return 1
  let score = 0
  let ti = 0
  let lastHit = -2
  for (const ch of q) {
    const found = t.indexOf(ch, ti)
    if (found === -1) return 0
    score += found === 0 || t[found - 1] === ' ' ? 3 : found === lastHit + 1 ? 2 : 1
    lastHit = found
    ti = found + 1
  }
  return score / (t.length * 0.25 + 1)
}

export function filterCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) return commands
  return commands
    .map((cmd) => ({
      cmd,
      score: Math.max(
        fuzzyScore(query, cmd.label),
        ...cmd.keywords.map((k) => fuzzyScore(query, k) * 0.8),
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.cmd)
}
