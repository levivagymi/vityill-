/**
 * Shared motion vocabulary. Mirrors the CSS custom properties declared in
 * app/globals.css (--ease-cinematic, --ease-out-soft) so CSS transitions and
 * GSAP tweens feel identical. 'cinematic' is a CustomEase registered in
 * lib/gsap.ts — always import gsap from '@/lib/gsap' before using it.
 */
export const EASE = {
  /** cubic-bezier(0.7, 0, 0.2, 1) — hero/overlay moves */
  cinematic: 'cinematic',
  /** soft decelerate — reveals, cards */
  out: 'power3.out',
  /** symmetric — wipes, masks */
  inOut: 'power2.inOut',
} as const

export const CSS_EASE = {
  cinematic: 'cubic-bezier(0.7, 0, 0.2, 1)',
  outSoft: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const

/** Durations in seconds, aligned with the 150–300ms micro-interaction rule. */
export const DUR = {
  xs: 0.2,
  sm: 0.35,
  md: 0.6,
  lg: 0.9,
  xl: 1.4,
} as const
