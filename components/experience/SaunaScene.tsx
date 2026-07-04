'use client'
import { useEffect, useRef } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import { isDark, makeSteam, drawSteam, rafLoop, type Particle, type RGB } from '@/lib/canvas-fx'

/**
 * Steam particles (shared physics from lib/canvas-fx) behind an SVG
 * feTurbulence/feDisplacementMap heat-haze whose distortion deepens with
 * scroll progress — the sauna gets hotter the further you go.
 */
export default function SaunaScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const turbRef = useRef<SVGFETurbulenceElement>(null)
  const dispRef = useRef<SVGFEDisplacementMapElement>(null)
  const particles = useRef<Particle[]>([])
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
      particles.current = makeSteam(W, H, 70)
    }
    resize()
    window.addEventListener('resize', resize)

    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => { intensityRef.current = self.progress },
    })

    let frame = 0
    const loop = rafLoop((t) => {
      frame++
      const intensity = intensityRef.current

      // Heat-haze: baseFrequency wobbles slowly, displacement grows with heat.
      const scale = 8 + intensity * 28
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
    })
    loop.start()

    return () => {
      loop.stop()
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
