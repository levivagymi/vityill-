'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Locale } from '@/lib/types'

type Tone = 'auto' | 'light' | 'dark'

const EMBLEM_RATIO = 1254 / 790 // width / height

/**
 * Brand mark for Vityilló.
 * - tone="auto"  → cream on dark theme, forest on light theme (Tailwind `dark:` swap)
 * - tone="light" → always cream (use over dark imagery / hero banners)
 * - tone="dark"  → always forest (use over cream surfaces)
 */
function Emblem({ height, tone, priority }: { height: number; tone: Tone; priority?: boolean }) {
  const width = Math.round(height * EMBLEM_RATIO)
  const cream = (
    <Image
      src="/brand/emblem-cream.png"
      alt=""
      aria-hidden
      width={1254}
      height={790}
      priority={priority}
      style={{ height, width }}
      className={tone === 'auto' ? 'hidden dark:block' : tone === 'light' ? 'block' : 'hidden'}
    />
  )
  const forest = (
    <Image
      src="/brand/emblem-forest.png"
      alt=""
      aria-hidden
      width={1254}
      height={790}
      priority={priority}
      style={{ height, width }}
      className={tone === 'auto' ? 'block dark:hidden' : tone === 'dark' ? 'block' : 'hidden'}
    />
  )
  return (
    <span className="inline-flex shrink-0 items-center" style={{ height }}>
      {cream}
      {forest}
    </span>
  )
}

/** Standalone emblem (no link / wordmark) for decorative brand accents in headings. */
export function EmblemMark({ height = 28, tone = 'auto', className = '' }: { height?: number; tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex ${className}`}>
      <Emblem height={height} tone={tone} />
    </span>
  )
}

/** The complete designed logo (emblem + VITYILLÓ wordmark) as a square raster mark. */
function FullMark({ height, tone, priority }: { height: number; tone: Tone; priority?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center" style={{ height, width: height }}>
      <Image
        src="/brand/logo-cream.png"
        alt=""
        aria-hidden
        width={1254}
        height={1254}
        priority={priority}
        style={{ height, width: height }}
        className={tone === 'auto' ? 'hidden dark:block' : tone === 'light' ? 'block' : 'hidden'}
      />
      <Image
        src="/brand/logo-forest.png"
        alt=""
        aria-hidden
        width={1254}
        height={1254}
        priority={priority}
        style={{ height, width: height }}
        className={tone === 'auto' ? 'block dark:hidden' : tone === 'dark' ? 'block' : 'hidden'}
      />
    </span>
  )
}

const toneText: Record<Tone, string> = {
  auto: 'text-foreground',
  light: 'text-[#FFF4CC]',
  dark: 'text-[#1A4731]',
}
const toneSub: Record<Tone, string> = {
  auto: 'text-foreground/45',
  light: 'text-[rgba(255,244,204,0.6)]',
  dark: 'text-[rgba(26,71,49,0.55)]',
}

export default function Logo({
  variant = 'lockup',
  height = 36,
  tone = 'auto',
  href: linkHref,
  priority = false,
  className = '',
  ariaLabel = 'Vityilló Vendégház',
}: {
  variant?: 'emblem' | 'lockup' | 'full'
  height?: number
  tone?: Tone
  href?: string
  priority?: boolean
  className?: string
  ariaLabel?: string
}) {
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const target = linkHref ?? `/${lang}`

  const content =
    variant === 'full' ? (
      <FullMark height={height} tone={tone} priority={priority} />
    ) : variant === 'emblem' ? (
      <Emblem height={height} tone={tone} priority={priority} />
    ) : (
      <span className="inline-flex items-center gap-2.5">
        <Emblem height={height} tone={tone} priority={priority} />
        <span className="flex flex-col leading-none">
          <span
            className={`font-heading font-semibold tracking-wide ${toneText[tone]}`}
            style={{ fontSize: height * 0.5 }}
          >
            Vityilló
          </span>
          <span
            className={`font-sans uppercase tracking-[0.28em] ${toneSub[tone]}`}
            style={{ fontSize: Math.max(8, height * 0.2), marginTop: 2 }}
          >
            Vendégház
          </span>
        </span>
      </span>
    )

  return (
    <Link
      href={target}
      aria-label={ariaLabel}
      data-cursor="view"
      className={`inline-flex items-center group ${className}`}
    >
      {content}
    </Link>
  )
}
