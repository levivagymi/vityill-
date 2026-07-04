'use client'
import { useEffect, useRef } from 'react'
import { isDark, makeEmbers, drawEmbers, rafLoop, EC, type Particle, type RGB } from '@/lib/canvas-fx'

/** Theme-tinted ember palette for light mode; dark mode keeps the fire hues. */
const LIGHT_EMBERS: RGB[] = [[26, 71, 49], [40, 90, 60], [26, 71, 49], [60, 110, 70], [26, 71, 49]]

/**
 * Ember engine (shared physics from lib/canvas-fx). Scroll velocity fans the
 * fire: fast scrolling gives every ember a temporary updraft and brightens
 * the base glow.
 */
export default function BogracCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const embers = useRef<Particle[]>([])
  const scrollSpeedRef = useRef(0)
  const prevScrollY = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0
    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      embers.current = makeEmbers(W, H, 90)
    }
    resize()
    window.addEventListener('resize', resize)

    const onScroll = () => {
      scrollSpeedRef.current = Math.min(Math.abs(window.scrollY - prevScrollY.current) / 20, 1)
      prevScrollY.current = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const loop = rafLoop((t) => {
      const speed = scrollSpeedRef.current
      scrollSpeedRef.current *= 0.92

      // Updraft: scroll velocity lifts the whole ember field for a beat.
      if (speed > 0.05) {
        for (const p of embers.current) p.y -= speed * 3
      }
      if (glowRef.current) {
        glowRef.current.style.opacity = String(0.3 + speed * 0.45)
      }

      drawEmbers(ctx, W, H, embers.current, t, isDark() ? EC : LIGHT_EMBERS)
    })
    loop.start()

    return () => {
      loop.stop()
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 z-[2]" aria-hidden />
      <div
        ref={glowRef}
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-[1] pointer-events-none"
        style={{
          height: '55%',
          opacity: 0.3,
          background:
            'radial-gradient(ellipse 70% 100% at 50% 100%, rgba(255,88,0,0.42) 0%, rgba(255,45,0,0.2) 45%, transparent 100%)',
          willChange: 'opacity',
        }}
      />
    </>
  )
}
