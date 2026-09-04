'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import type Lenis from 'lenis'
import gsap, { ScrollTrigger } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/utils'
import { fxFull } from '@/lib/fx'

const LenisContext = createContext<Lenis | null>(null)

export function useLenis() {
  return useContext(LenisContext)
}

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    // Smooth scroll is a decoration with a permanent cost: a per-frame RAF that
    // rewrites the scroll position and drives ScrollTrigger. On a device that
    // is already dropping frames it makes scrolling *worse*, so lite mode gets
    // the browser's own scrolling instead. Every consumer goes through the
    // helpers below, which fall back to native APIs when this is null.
    if (!fxFull()) return

    let instance: Lenis | null = null
    let tickerFn: ((time: number) => void) | null = null
    let cancelled = false

    // Dynamic on purpose: a static import puts Lenis in the initial bundle for
    // every visitor, including the ones who will never instantiate it.
    import('lenis').then(({ default: LenisCtor }) => {
      if (cancelled) return

      instance = new LenisCtor({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        touchMultiplier: 2,
        // Keep the instance (stop/start/scrollTo API stays available) but skip
        // wheel smoothing for users who asked the OS to minimize motion.
        smoothWheel: !prefersReducedMotion(),
      })

      tickerFn = (time: number) => instance?.raf(time * 1000)

      instance.on('scroll', ScrollTrigger.update)
      gsap.ticker.add(tickerFn)
      gsap.ticker.lagSmoothing(0)

      // Exposing the freshly-created Lenis instance via context is an external-system
      // subscription — the canonical, allowed use of setState inside an effect.
      setLenis(instance)
    })

    return () => {
      cancelled = true
      instance?.destroy()
      if (tickerFn) gsap.ticker.remove(tickerFn)
    }
  }, [])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}

// ── Scroll helpers ───────────────────────────────────────────────────────────
// Lenis is absent in lite mode and for the first few frames of every full-mode
// load (it arrives with its dynamic chunk). Callers pass whatever useLenis()
// gave them; these degrade to the native equivalent rather than no-op.

/** Nested overlays (command palette over an open lightbox) must not unlock
 *  the page when only the inner one closes. */
let nativeLockDepth = 0

/** Freeze page scrolling behind a modal surface. */
export function scrollLock(lenis: Lenis | null) {
  if (lenis) {
    lenis.stop()
    return
  }
  nativeLockDepth += 1
  if (nativeLockDepth === 1) document.body.style.overflow = 'hidden'
}

/** Release a lock taken by scrollLock with the same instance (or lack of one). */
export function scrollUnlock(lenis: Lenis | null) {
  if (lenis) {
    lenis.start()
    return
  }
  nativeLockDepth = Math.max(0, nativeLockDepth - 1)
  if (nativeLockDepth === 0) document.body.style.overflow = ''
}

/** Scroll an in-page anchor into view. `offset` is negative to leave room for
 *  the fixed navbar, matching Lenis's own sign convention. */
export function scrollToAnchor(lenis: Lenis | null, selector: string, offset = 0) {
  if (lenis) {
    lenis.scrollTo(selector, { offset })
    return
  }
  const el = document.querySelector<HTMLElement>(selector)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY + offset
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

/** Jump to the top of the document without animation. */
export function scrollToTop(lenis: Lenis | null) {
  if (lenis) {
    lenis.scrollTo(0, { immediate: true })
    return
  }
  window.scrollTo(0, 0)
}
