'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import gsap, { ScrollTrigger } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/utils'
import { EASE } from '@/lib/motion'
import { hasPendingFlip } from '@/lib/flip-transition'
import { useLenis } from './LenisProvider'

/**
 * Palette-inverting route wipe: the curtain is the *inverse* surface of the
 * current theme (cream over a forest page, forest over a cream page), with a
 * trailing veil in the destination surface color — so every dark↔light
 * handover reads as a deliberate dual-palette move instead of a flat block.
 * Stands down entirely when a shared-element FLIP owns the transition.
 */
export default function PageTransitionOverlay() {
  const wipeRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const lenis = useLenis()
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    const wipe = wipeRef.current
    const veil = veilRef.current
    if (!wipe || !veil) return

    lenis?.scrollTo(0, { immediate: true })

    if (prefersReducedMotion() || hasPendingFlip()) {
      gsap.set([wipe, veil], { clipPath: 'inset(0 0 100% 0)' })
      ScrollTrigger.refresh()
      return
    }

    if (tlRef.current) tlRef.current.kill()

    gsap.set(wipe, { clipPath: 'inset(0 0 0% 0)' })
    gsap.set(veil, { clipPath: 'inset(0 0 0% 0)' })

    tlRef.current = gsap
      .timeline({ delay: 0.05 })
      .to(wipe, {
        clipPath: 'inset(100% 0 0% 0)',
        duration: 0.85,
        ease: EASE.cinematic,
      })
      .to(
        veil,
        {
          clipPath: 'inset(100% 0 0% 0)',
          duration: 0.85,
          ease: EASE.cinematic,
          onComplete: () => {
            gsap.set([wipe, veil], { clipPath: 'inset(0 0 100% 0)' })
            // Layout may have shifted while the overlay covered the page.
            ScrollTrigger.refresh()
          },
        },
        0.12,
      )

    return () => {
      tlRef.current?.kill()
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const layer: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    clipPath: 'inset(0 0 100% 0)',
    willChange: 'clip-path',
  }

  return (
    <>
      {/* Destination-surface veil (trails, reveals the page) */}
      <div ref={veilRef} aria-hidden style={{ ...layer, zIndex: 9998, backgroundColor: 'var(--background)' }} />
      {/* Inverse-palette curtain (leads, on top) */}
      <div ref={wipeRef} aria-hidden style={{ ...layer, zIndex: 9999, backgroundColor: 'var(--foreground)' }} />
    </>
  )
}
