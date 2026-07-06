'use client'
import { useEffect, useRef } from 'react'
import {
  isDark, makeEmbers, drawEmbers, rafLoop, EC, trackPointer, makeSparkPool, emitSpark, drawSparks,
  type Particle, type RGB, type SparkOpts,
} from '@/lib/canvas-fx'

/** Theme-tinted ember palette for light mode; dark mode keeps the fire hues. */
const LIGHT_EMBERS: RGB[] = [[26, 71, 49], [40, 90, 60], [26, 71, 49], [60, 110, 70], [26, 71, 49]]

const STOKE_SPARK: SparkOpts = { r: [1, 2.2], rise: [-2.2, -0.8], kick: 0.2 }

/**
 * Ember engine (shared physics from lib/canvas-fx). Scroll velocity fans the
 * fire: fast scrolling gives every ember a temporary updraft and brightens
 * the base glow. The cursor stokes it — nearby embers flare and lift, and
 * quick strokes strike sparks off the fire.
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

    const pointer = trackPointer()
    const sparks = makeSparkPool(30)
    let sparkAcc = 0
    let sparkSlot = 0

    const loop = rafLoop((t) => {
      const speed = scrollSpeedRef.current
      scrollSpeedRef.current *= 0.92
      const m = pointer.state

      // Stoking: embers near the cursor flare and lift — positional, like the
      // scroll updraft, so the base drift never accumulates.
      if (m.active) {
        for (const p of embers.current) {
          const dx = p.x - m.x
          const dy = p.y - m.y
          const d2 = dx * dx + dy * dy
          if (d2 >= 140 * 140 || d2 < 1) continue
          const f = 1 - Math.sqrt(d2) / 140
          p.y -= f * 2.6
          p.x += (Math.random() - 0.5) * f * 2
          p.opacity = Math.min(p.maxOpacity, p.opacity + f * 0.05)
        }
      }

      // Updraft: scroll velocity lifts the whole ember field for a beat.
      if (speed > 0.05) {
        for (const p of embers.current) p.y -= speed * 3
      }
      if (glowRef.current) {
        glowRef.current.style.opacity = String(0.3 + speed * 0.45 + Math.min(0.25, m.speed * 0.012))
      }

      drawEmbers(ctx, W, H, embers.current, t, isDark() ? EC : LIGHT_EMBERS)

      // Quick strokes strike sparks off the fire.
      if (m.active && m.speed > 6) {
        sparkAcc += 1.1 * Math.min(1, m.speed / 24)
        while (sparkAcc >= 1) {
          sparkAcc -= 1
          emitSpark(sparks[sparkSlot % sparks.length], m, STOKE_SPARK)
          sparkSlot++
        }
      }
      drawSparks(ctx, sparks, t, isDark() ? EC : LIGHT_EMBERS)

      pointer.decay()
    })
    loop.start()

    return () => {
      loop.stop()
      pointer.dispose()
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
