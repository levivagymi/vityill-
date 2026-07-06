'use client'
import { useEffect, useRef } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import {
  isDark, makeSteam, drawSteam, rafLoop, trackPointer, drive, applyPointerForce,
  type DrivenParticle, type PointerFx, type RGB,
} from '@/lib/canvas-fx'

/**
 * Steam particles (shared physics from lib/canvas-fx) behind an SVG
 * feTurbulence/feDisplacementMap heat-haze whose distortion deepens with
 * scroll progress — the sauna gets hotter the further you go. Waving the
 * cursor parts the steam like a hand and flares the haze for a beat.
 */

const STIR: PointerFx = { kind: 'repel', radius: 150, strength: 1.6 }
export default function SaunaScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const turbRef = useRef<SVGFETurbulenceElement>(null)
  const dispRef = useRef<SVGFEDisplacementMapElement>(null)
  const particles = useRef<DrivenParticle[]>([])
  const intensityRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0
    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      particles.current = drive(makeSteam(W, H, 70))
    }
    resize()
    window.addEventListener('resize', resize)

    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => { intensityRef.current = self.progress },
    })

    const pointer = trackPointer()

    let frame = 0
    const loop = rafLoop((t) => {
      frame++
      const intensity = intensityRef.current
      const m = pointer.state

      // A hand through the steam: particles part around the cursor.
      applyPointerForce(particles.current, m, STIR)

      // Heat-haze: baseFrequency wobbles slowly, displacement grows with heat —
      // and flares briefly when the cursor whips through.
      const scale = 8 + intensity * 28 + Math.min(14, m.speed * 0.35)
      const freq = 0.006 + intensity * 0.014 + Math.sin(frame * 0.008) * 0.002
      if (turbRef.current) {
        turbRef.current.setAttribute('baseFrequency', `${freq.toFixed(4)} ${(freq * 0.7).toFixed(4)}`)
      }
      if (dispRef.current) {
        dispRef.current.setAttribute('scale', String(Math.round(scale)))
      }

      const steamColor: RGB = isDark() ? [255, 244, 204] : [26, 71, 49]
      ctx.globalAlpha = 0.45 + intensity * 0.55
      drawSteam(ctx, W, H, particles.current, t, steamColor)
      ctx.globalAlpha = 1
      pointer.decay()
    })
    loop.start()

    return () => {
      loop.stop()
      pointer.dispose()
      window.removeEventListener('resize', resize)
      st.kill()
    }
  }, [])

  return (
    <>
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden>
        <defs>
          <filter id="sauna-distort" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence ref={turbRef} type="turbulence" baseFrequency="0.006 0.004" numOctaves="3" seed="2" result="noise" />
            <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      {/* Distorted wash the heat-haze filter can visibly bend */}
      <div
        className="absolute inset-0 z-[1]"
        aria-hidden
        style={{
          filter: 'url(#sauna-distort)',
          background:
            'radial-gradient(ellipse 90% 60% at 50% 100%, color-mix(in oklab, var(--foreground) 14%, transparent) 0%, transparent 70%)',
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 z-[2] pointer-events-none" aria-hidden />
    </>
  )
}
