'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Locale } from '@/lib/types'

type Tone = 'auto' | 'light' | 'dark'

const EMBLEM_RATIO = 1254 / 790 // width / height

/**
 * Brand mark for Vityilló.
 * - tone="auto"  → cream on dark theme, forest on light theme
 * - tone="light" → always cream (use over dark imagery / hero banners)
 * - tone="dark"  → always forest (use over cream surfaces)
 *
 * Rendered as a CSS mask tinted with `color` rather than an <img>; see the
 * `.brand-mark` block in globals.css for why. The three tints below are the
 * literal values --foreground resolves to in each theme, so tone="auto"
 * following the theme token and the two fixed tones stay in step.
 */
const toneColor: Record<Tone, string> = {
  auto: 'var(--foreground)',
  light: '#FFF4CC',
  dark: '#1A4731',
}

function Emblem({ height, tone }: { height: number; tone: Tone }) {
  const width = Math.round(height * EMBLEM_RATIO)
  return (
    <span
      aria-hidden
      className="brand-mark brand-emblem"
      style={{ width, height, color: toneColor[tone] }}
    />
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
function FullMark({ height, tone }: { height: number; tone: Tone }) {
  return (
    <span className="inline-flex shrink-0 items-center" style={{ height, width: height }}>
      <span
        aria-hidden
        className="brand-mark brand-logo"
        style={{ width: height, height, color: toneColor[tone] }}
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
  className = '',
  ariaLabel = 'Vityilló Vendégház',
}: {
  variant?: 'emblem' | 'lockup' | 'full'
  height?: number
  tone?: Tone
  href?: string
  className?: string
  ariaLabel?: string
}) {
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const target = linkHref ?? `/${lang}`

  const content =
    variant === 'full' ? (
      <FullMark height={height} tone={tone} />
    ) : variant === 'emblem' ? (
      <Emblem height={height} tone={tone} />
    ) : (
      <span className="inline-flex items-center gap-2.5">
        <Emblem height={height} tone={tone} />
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
