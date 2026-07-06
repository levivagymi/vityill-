'use client'
import { useEffect, useRef } from 'react'
import gsap, { ScrollTrigger } from '@/lib/gsap'
import {
  isDark, makeSteam, drawSteam, makeEmbers, drawEmbers, rafLoop,
  type Particle, type RGB,
} from '@/lib/canvas-fx'

/**
 * Shared scene for the experience subpages that don't warrant a bespoke
 * physics canvas. Depth comes from scrub-parallaxed gradient washes over the
 * fallback still, atmosphere from the shared canvas-fx particles, and — like
 * the bespoke scenes — everything intensifies with scroll progress. Reduced
 * motion never reaches this component: ExperienceScene only mounts it when
 * allowAmbientMotion() holds.
 */

export type ParallaxVariant = 'erdo' | 'vilagitas' | 'kilatas' | 'klima' | 'tv' | 'konyha'

type ParticleFx =
  | { kind: 'steam'; count: number; scale: { vx: number; vy: number }; push?: number; dark: RGB; light: RGB }
  | { kind: 'embers'; count: number; scale: { vx: number; vy: number }; palette: RGB[] }
  | { kind: 'none' }

type VariantConfig = {
  fx: ParticleFx
  /** Gradient washes, each scrub-tweened to its own yPercent for depth separation. */
  layers: { background: string; yPercent: number }[]
  /** Ambient accent glow breathing on an opacity yoyo. */
  pulse?: { background: string; from: number; to: number; duration: number }
}

const CONFIGS: Record<ParallaxVariant, VariantConfig> = {
  erdo: {
    fx: { kind: 'steam', count: 55, scale: { vx: 0.7, vy: 0.45 }, dark: [222, 240, 216], light: [26, 71, 49] },
    layers: [
      { background: 'linear-gradient(to top, color-mix(in oklab, var(--foreground) 12%, transparent) 0%, transparent 55%)', yPercent: 12 },
      { background: 'radial-gradient(ellipse 120% 55% at 50% 0%, color-mix(in oklab, var(--background) 65%, transparent) 0%, transparent 70%)', yPercent: -16 },
    ],
  },
  vilagitas: {
    fx: { kind: 'embers', count: 22, scale: { vx: 0.4, vy: 0.3 }, palette: [[255, 214, 120], [255, 190, 90], [255, 235, 170]] },
    layers: [
      { background: 'radial-gradient(ellipse 80% 55% at 50% 100%, rgba(255, 190, 90, 0.16) 0%, transparent 70%)', yPercent: 10 },
      { background: 'linear-gradient(to bottom, color-mix(in oklab, var(--background) 55%, transparent) 0%, transparent 45%)', yPercent: -12 },
    ],
    pulse: { background: 'radial-gradient(ellipse 55% 40% at 50% 78%, rgba(255, 205, 120, 0.22) 0%, transparent 70%)', from: 0.35, to: 0.8, duration: 2.6 },
  },
  kilatas: {
    fx: { kind: 'none' },
    layers: [
      { background: 'radial-gradient(ellipse 130% 45% at 50% 8%, color-mix(in oklab, var(--background) 70%, transparent) 0%, transparent 75%)', yPercent: -18 },
      { background: 'linear-gradient(to top, transparent 40%, color-mix(in oklab, var(--foreground) 7%, transparent) 68%, transparent 100%)', yPercent: 8 },
      { background: 'linear-gradient(to top, color-mix(in oklab, var(--foreground) 13%, transparent) 0%, transparent 45%)', yPercent: 20 },
    ],
  },
  klima: {
    fx: { kind: 'steam', count: 45, scale: { vx: 0.6, vy: 0.55 }, push: 0.9, dark: [195, 225, 255], light: [30, 90, 140] },
    layers: [
      { background: 'linear-gradient(105deg, color-mix(in oklab, var(--foreground) 9%, transparent) 0%, transparent 55%)', yPercent: -10 },
      { background: 'linear-gradient(to top, color-mix(in oklab, var(--foreground) 8%, transparent) 0%, transparent 50%)', yPercent: 14 },
    ],
  },
  tv: {
    fx: { kind: 'steam', count: 18, scale: { vx: 0.35, vy: 0.3 }, dark: [200, 220, 255], light: [40, 70, 120] },
    layers: [
      { background: 'linear-gradient(to bottom, color-mix(in oklab, var(--background) 50%, transparent) 0%, transparent 40%)', yPercent: -10 },
    ],
    pulse: { background: 'radial-gradient(ellipse 62% 46% at 50% 55%, rgba(150, 190, 255, 0.15) 0%, transparent 70%)', from: 0.3, to: 0.7, duration: 1.8 },
  },
  konyha: {
    fx: { kind: 'steam', count: 50, scale: { vx: 0.8, vy: 0.7 }, dark: [255, 236, 200], light: [140, 85, 35] },
    layers: [
      { background: 'linear-gradient(to top, color-mix(in oklab, var(--foreground) 11%, transparent) 0%, transparent 50%)', yPercent: 12 },
    ],
    pulse: { background: 'radial-gradient(ellipse 70% 45% at 50% 92%, rgba(255, 170, 80, 0.14) 0%, transparent 70%)', from: 0.4, to: 0.75, duration: 3.2 },
  },
}

export default function ParallaxScene({ variant }: { variant: ParallaxVariant }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const intensityRef = useRef(0)

  useEffect(() => {
    const cfg = CONFIGS[variant]
    const root = rootRef.current
    if (!root) return

    const gsapCtx = gsap.context(() => {
      // Scroll intensity over the whole page — SubpageShell's sticky viewport
      // is the pin, so the trigger spans the document like the bespoke scenes.
      ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => { intensityRef.current = self.progress },
      })
      gsap.utils.toArray<HTMLElement>('.px-layer').forEach((el, i) => {
        gsap.fromTo(el, { yPercent: 0 }, {
          yPercent: cfg.layers[i].yPercent,
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
      })
      if (cfg.pulse) {
        gsap.fromTo('.px-accent', { opacity: cfg.pulse.from }, {
          opacity: cfg.pulse.to,
          duration: cfg.pulse.duration,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        })
      }
    }, root)

    const fx = cfg.fx
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (fx.kind === 'none' || !canvas || !ctx) {
      return () => gsapCtx.revert()
    }

    let W = 0, H = 0
    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      const ps = fx.kind === 'embers' ? makeEmbers(W, H, fx.count) : makeSteam(W, H, fx.count)
      for (const p of ps) {
        p.vx = p.vx * fx.scale.vx + (fx.kind === 'steam' ? fx.push ?? 0 : 0)
        p.vy *= fx.scale.vy
      }
      particles.current = ps
    }
    resize()
    window.addEventListener('resize', resize)

    const loop = rafLoop((t) => {
      ctx.globalAlpha = 0.4 + intensityRef.current * 0.6
      if (fx.kind === 'embers') drawEmbers(ctx, W, H, particles.current, t, fx.palette)
      else drawSteam(ctx, W, H, particles.current, t, isDark() ? fx.dark : fx.light)
      ctx.globalAlpha = 1
    })
    loop.start()

    return () => {
      loop.stop()
      window.removeEventListener('resize', resize)
      gsapCtx.revert()
    }
  }, [variant])

  const cfg = CONFIGS[variant]

  return (
    <div ref={rootRef} className="absolute inset-0 z-[1] pointer-events-none" aria-hidden>
      {cfg.layers.map((layer, i) => (
        <div
          key={i}
          className="px-layer absolute inset-x-0 -inset-y-[8%]"
          style={{ background: layer.background, willChange: 'transform' }}
        />
      ))}
      {cfg.pulse && (
        <div
          className="px-accent absolute inset-0"
          style={{ background: cfg.pulse.background, opacity: cfg.pulse.from }}
        />
      )}
      {cfg.fx.kind !== 'none' && <canvas ref={canvasRef} className="absolute inset-0" />}
    </div>
  )
}
