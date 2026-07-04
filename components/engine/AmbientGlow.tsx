'use client'
import { useEffect, useRef } from 'react'
import gsap from '@/lib/gsap'
import { allowAmbientMotion } from '@/lib/utils'

/**
 * A single fixed radial-gradient that lerp-follows the pointer (same loop
 * discipline as CustomCursor) and reads as ambient light via soft-light
 * blending. Off on coarse pointers, reduced motion/data, and during the
 * cinematic section (globals.css hides .ambient-glow under data-cinematic).
 */
export default function AmbientGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (!allowAmbientMotion()) return

    const el = ref.current
    if (!el) return

    let mouseX = -9999
    let mouseY = -9999
    let x = -9999
    let y = -9999
    let seen = false

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (!seen) {
        seen = true
        x = mouseX
        y = mouseY
        gsap.to(el, { opacity: 0.06, duration: 1.2, ease: 'power2.out' })
      }
    }

    const tickerFn = () => {
      if (!seen) return
      x = lerp(x, mouseX, 0.06)
      y = lerp(y, mouseY, 0.06)
      gsap.set(el, { x, y, xPercent: -50, yPercent: -50 })
    }

    gsap.ticker.add(tickerFn)
    window.addEventListener('mousemove', onMove, { passive: true })

    return () => {
      gsap.ticker.remove(tickerFn)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return <div ref={ref} aria-hidden className="ambient-glow" />
}
