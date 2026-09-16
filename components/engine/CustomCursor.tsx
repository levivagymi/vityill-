'use client'
import { useEffect, useRef } from 'react'
import gsap from '@/lib/gsap'

/** Elements over which the native cursor is restored (see globals.css). */
const NATIVE_CURSOR_SELECTOR = 'input, textarea, select, iframe'

/**
 * Single lerped dot on `mix-blend-mode: difference` — it inverts against
 * whatever sits under it, so it stays legible over both the dark forest
 * and cream sections with no per-state color logic. Scales up over
 * `[data-cursor="view"]` targets; that's the only state anything sets.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const dot = dotRef.current
    if (!dot) return

    let mouseX = -999
    let mouseY = -999
    let x = -999
    let y = -999
    let visible = false

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const show = () => {
      if (visible) return
      visible = true
      gsap.to(dot, { autoAlpha: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
    }
    const hide = () => {
      if (!visible) return
      visible = false
      gsap.to(dot, { autoAlpha: 0, duration: 0.25, ease: 'power2.out', overwrite: 'auto' })
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      show()
    }

    // Event delegation: one listener pair handles every current and future
    // [data-cursor] element — no MutationObserver rescans needed.
    const onOver = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return
      if (target.closest(NATIVE_CURSOR_SELECTOR)) {
        hide()
        return
      }
      show()
      const isView = !!target.closest('[data-cursor="view"]')
      gsap.to(dot, { scale: isView ? 1.8 : 1, duration: 0.35, ease: 'power3.out', overwrite: 'auto' })
    }

    // Hide the dot when the pointer leaves the window entirely.
    const onDocLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) hide()
    }

    const tickerFn = () => {
      x = lerp(x, mouseX, 0.16)
      y = lerp(y, mouseY, 0.16)
      gsap.set(dot, { x, y, xPercent: -50, yPercent: -50 })
    }

    gsap.ticker.add(tickerFn)
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseover', onOver, { passive: true })
    document.addEventListener('mouseout', onDocLeave, { passive: true })

    return () => {
      gsap.ticker.remove(tickerFn)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onDocLeave)
    }
  }, [])

  return (
    <div
      ref={dotRef}
      aria-hidden
      className="ce-cursor-dot"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 14,
        height: 14,
        borderRadius: '50%',
        backgroundColor: '#fff',
        mixBlendMode: 'difference',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0,
        willChange: 'transform',
      }}
    />
  )
}
