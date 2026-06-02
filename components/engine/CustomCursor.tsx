'use client'
import { useEffect, useRef } from 'react'
import gsap from '@/lib/gsap'

type CursorState = 'default' | 'view' | 'pluck' | 'ripple'

export default function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    let mouseX = -999
    let mouseY = -999
    let outerX = -999
    let outerY = -999
    let innerX = -999
    let innerY = -999
    let visible = false

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (!visible) {
        visible = true
        gsap.to([outer, inner], { opacity: 1, duration: 0.4, ease: 'power2.out' })
      }
    }

    const applyState = (state: CursorState) => {
      const opts = { duration: 0.35, ease: 'power2.out', overwrite: 'auto' as const }
      const fg = 'var(--foreground)'
      if (state === 'view') {
        gsap.to(outer, { ...opts, scale: 1.6, backgroundColor: 'transparent', borderColor: fg, opacity: 0.7 })
        gsap.to(inner, { ...opts, scale: 0, opacity: 0 })
      } else if (state === 'pluck') {
        gsap.to(outer, { ...opts, scale: 0.5, backgroundColor: 'transparent', borderColor: fg, opacity: 1 })
        gsap.to(inner, { ...opts, scale: 2.5, opacity: 1 })
      } else if (state === 'ripple') {
        gsap.to(outer, { ...opts, scale: 3, backgroundColor: 'transparent', borderColor: fg, opacity: 0.35 })
        gsap.to(inner, { ...opts, scale: 0, opacity: 0 })
      } else {
        gsap.to(outer, { ...opts, scale: 1, backgroundColor: 'transparent', borderColor: fg, opacity: 0.8 })
        gsap.to(inner, { ...opts, scale: 1, opacity: 1 })
      }
    }

    const onEnter = (e: Event) => {
      const el = e.currentTarget as HTMLElement
      applyState((el.dataset.cursor || 'default') as CursorState)
    }
    const onLeave = () => applyState('default')

    const scanTargets = () => {
      document.querySelectorAll('[data-cursor]').forEach((el) => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }

    scanTargets()

    const observer = new MutationObserver(scanTargets)
    observer.observe(document.body, { childList: true, subtree: true })

    const tickerFn = () => {
      outerX = lerp(outerX, mouseX, 0.08)
      outerY = lerp(outerY, mouseY, 0.08)
      innerX = lerp(innerX, mouseX, 0.15)
      innerY = lerp(innerY, mouseY, 0.15)
      gsap.set(outer, { x: outerX, y: outerY, xPercent: -50, yPercent: -50 })
      gsap.set(inner, { x: innerX, y: innerY, xPercent: -50, yPercent: -50 })
    }

    gsap.ticker.add(tickerFn)
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      gsap.ticker.remove(tickerFn)
      window.removeEventListener('mousemove', onMouseMove)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <div
        ref={outerRef}
        aria-hidden
        className="ce-cursor-outer"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1.5px solid var(--foreground)',
          backgroundColor: 'transparent',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0,
          willChange: 'transform',
        }}
      />
      <div
        ref={innerRef}
        aria-hidden
        className="ce-cursor-inner"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'var(--foreground)',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0,
          willChange: 'transform',
        }}
      />
    </>
  )
}
