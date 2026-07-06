'use client'
import { useEffect, useRef } from 'react'
import gsap, { ScrollTrigger } from '@/lib/gsap'
import {
  isDark, makeSteam, drawSteam, makeEmbers, drawEmbers, rafLoop,
  trackPointer, drive, applyPointerForce, makeSparkPool, emitSpark, drawSparks,
  type DrivenParticle, type PointerFx, type SparkOpts, type RGB,
} from '@/lib/canvas-fx'

/**
 * Shared scene for the experience subpages that don't warrant a bespoke
 * physics canvas — but each variant still owns a distinct character: its own
 * ambient particle field, its own cursor force (wind, lamplight, stirring,
 * gusts…), its own cursor-trail palette, and its own gradient-layer depth.
 * Scroll progress intensifies everything, exactly like the bespoke scenes.
 * Reduced motion never reaches this component: ExperienceScene only mounts it
 * when allowAmbientMotion() holds.
 */

export type ParallaxVariant = 'erdo' | 'vilagitas' | 'kilatas' | 'klima' | 'tv' | 'konyha'

type ParticleFx =
  | { kind: 'steam'; count: number; scale: { vx: number; vy: number }; push?: number; dark: RGB; light: RGB }
  | { kind: 'embers'; count: number; scale: { vx: number; vy: number }; palette: RGB[] }

type TrailFx = SparkOpts & {
  palette: RGB[]
  /** Sparks emitted per frame at full pointer speed. */
  rate: number
  cap: number
  minSpeed: number
}

type VariantConfig = {
  fx: ParticleFx
  /** Cursor force field applied to the ambient particles. */
  pointer: PointerFx
  /** Cursor trail sparks. */
  trail: TrailFx
  /** Gradient washes: scrub-tweened yPercent for scroll depth, optional
   *  mouseDepth (px) for pointer-parallax tilt on a separate transform channel. */
  layers: { background: string; yPercent: number; mouseDepth?: number }[]
  /** Ambient accent glow breathing on an opacity yoyo. */
  pulse?: { background: string; from: number; to: number; duration: number }
}

const CONFIGS: Record<ParallaxVariant, VariantConfig> = {
  // Wind through the foliage: mist parts around the cursor, spores settle in its wake.
  erdo: {
    fx: { kind: 'steam', count: 55, scale: { vx: 0.7, vy: 0.45 }, dark: [222, 240, 216], light: [26, 71, 49] },
    pointer: { kind: 'repel', radius: 160, strength: 1.5 },
    trail: { palette: [[190, 230, 170], [225, 240, 216], [150, 200, 140]], rate: 1.6, cap: 50, minSpeed: 4, r: [1.2, 2.6], rise: [0.2, 0.9], kick: 0.1 },
    layers: [
      { background: 'linear-gradient(to top, color-mix(in oklab, var(--foreground) 12%, transparent) 0%, transparent 55%)', yPercent: 12, mouseDepth: 10 },
      { background: 'radial-gradient(ellipse 120% 55% at 50% 0%, color-mix(in oklab, var(--background) 65%, transparent) 0%, transparent 70%)', yPercent: -16, mouseDepth: 16 },
    ],
  },
  // The cursor is a lamp: fireflies gather toward it and brighten, gold sparks trail it.
  vilagitas: {
    fx: { kind: 'embers', count: 22, scale: { vx: 0.4, vy: 0.3 }, palette: [[255, 214, 120], [255, 190, 90], [255, 235, 170]] },
    pointer: { kind: 'attract', radius: 220, strength: 1.1 },
    trail: { palette: [[255, 220, 130], [255, 240, 180], [255, 200, 100]], rate: 1.2, cap: 40, minSpeed: 5, r: [1, 2], rise: [-1.4, -0.4], kick: 0.12 },
    layers: [
      { background: 'radial-gradient(ellipse 80% 55% at 50% 100%, rgba(255, 190, 90, 0.16) 0%, transparent 70%)', yPercent: 10, mouseDepth: 8 },
      { background: 'linear-gradient(to bottom, color-mix(in oklab, var(--background) 55%, transparent) 0%, transparent 45%)', yPercent: -12, mouseDepth: 6 },
    ],
    pulse: { background: 'radial-gradient(ellipse 55% 40% at 50% 78%, rgba(255, 205, 120, 0.22) 0%, transparent 70%)', from: 0.35, to: 0.8, duration: 2.6 },
  },
  // The vista tilts with the cursor — strongest layer parallax — while drifting
  // seeds scatter softly out of the way.
  kilatas: {
    fx: { kind: 'steam', count: 14, scale: { vx: 0.5, vy: 0.35 }, dark: [235, 242, 250], light: [50, 80, 110] },
    pointer: { kind: 'repel', radius: 180, strength: 0.9 },
    trail: { palette: [[240, 245, 255], [255, 250, 235]], rate: 0.9, cap: 30, minSpeed: 6, r: [1, 2.2], rise: [-0.3, 0.5], kick: 0.18 },
    layers: [
      { background: 'radial-gradient(ellipse 130% 45% at 50% 8%, color-mix(in oklab, var(--background) 70%, transparent) 0%, transparent 75%)', yPercent: -18, mouseDepth: 26 },
      { background: 'linear-gradient(to top, transparent 40%, color-mix(in oklab, var(--foreground) 7%, transparent) 68%, transparent 100%)', yPercent: 8, mouseDepth: 14 },
      { background: 'linear-gradient(to top, color-mix(in oklab, var(--foreground) 13%, transparent) 0%, transparent 45%)', yPercent: 20, mouseDepth: 40 },
    ],
  },
  // Every stroke of the mouse is a gust: the airflow follows your hand,
  // frost crystals sparkle along the path.
  klima: {
    fx: { kind: 'steam', count: 45, scale: { vx: 0.6, vy: 0.55 }, push: 0.9, dark: [195, 225, 255], light: [30, 90, 140] },
    pointer: { kind: 'gust', radius: 260, strength: 1.4 },
    trail: { palette: [[190, 225, 255], [230, 245, 255], [160, 205, 250]], rate: 1.4, cap: 45, minSpeed: 7, r: [0.8, 1.8], rise: [-0.2, 0.6], kick: 0.45 },
    layers: [
      { background: 'linear-gradient(105deg, color-mix(in oklab, var(--foreground) 9%, transparent) 0%, transparent 55%)', yPercent: -10, mouseDepth: 8 },
      { background: 'linear-gradient(to top, color-mix(in oklab, var(--foreground) 8%, transparent) 0%, transparent 50%)', yPercent: 14, mouseDepth: 10 },
    ],
  },
  // Signal disturbance: motes snap away from the cursor and it sheds RGB glitch sparks.
  tv: {
    fx: { kind: 'steam', count: 18, scale: { vx: 0.35, vy: 0.3 }, dark: [200, 220, 255], light: [40, 70, 120] },
    pointer: { kind: 'repel', radius: 130, strength: 1.8 },
    trail: { palette: [[255, 70, 70], [80, 255, 140], [90, 140, 255]], rate: 2.2, cap: 60, minSpeed: 5, r: [0.8, 1.6], rise: [-0.6, 0.6], kick: 0.2 },
    layers: [
      { background: 'linear-gradient(to bottom, color-mix(in oklab, var(--background) 50%, transparent) 0%, transparent 40%)', yPercent: -10, mouseDepth: 6 },
    ],
    pulse: { background: 'radial-gradient(ellipse 62% 46% at 50% 55%, rgba(150, 190, 255, 0.15) 0%, transparent 70%)', from: 0.3, to: 0.7, duration: 1.8 },
  },
  // The cursor stirs the kitchen steam like a wooden spoon; quick moves
  // release spice sparks from the pot.
  konyha: {
    fx: { kind: 'steam', count: 50, scale: { vx: 0.8, vy: 0.7 }, dark: [255, 236, 200], light: [140, 85, 35] },
    pointer: { kind: 'vortex', radius: 190, strength: 1.6 },
    trail: { palette: [[255, 170, 80], [255, 120, 50], [255, 210, 120]], rate: 1.3, cap: 40, minSpeed: 6, r: [1, 2], rise: [-1.6, -0.6], kick: 0.15 },
    layers: [
      { background: 'linear-gradient(to top, color-mix(in oklab, var(--foreground) 11%, transparent) 0%, transparent 50%)', yPercent: 12, mouseDepth: 8 },
    ],
    pulse: { background: 'radial-gradient(ellipse 70% 45% at 50% 92%, rgba(255, 170, 80, 0.14) 0%, transparent 70%)', from: 0.4, to: 0.75, duration: 3.2 },
  },
}

export default function ParallaxScene({ variant }: { variant: ParallaxVariant }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<DrivenParticle[]>([])
  const intensityRef = useRef(0)

  useEffect(() => {
    const cfg = CONFIGS[variant]
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!root || !canvas || !ctx) return

    // Pointer-parallax setters, created inside the context so revert kills them.
    let layerSetters: { x: (v: number) => void; y: (v: number) => void; depth: number }[] = []

    const gsapCtx = gsap.context(() => {
      // Scroll intensity over the whole page — SubpageShell's sticky viewport
      // is the pin, so the trigger spans the document like the bespoke scenes.
      ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => { intensityRef.current = self.progress },
      })
      const layerEls = gsap.utils.toArray<HTMLElement>('.px-layer')
      layerEls.forEach((el, i) => {
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
      layerSetters = layerEls.flatMap((el, i) => {
        const depth = cfg.layers[i].mouseDepth ?? 0
        return depth
          ? [{
              x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power2.out' }),
              y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power2.out' }),
              depth,
            }]
          : []
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
    let W = 0, H = 0
    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      const ps = fx.kind === 'embers' ? makeEmbers(W, H, fx.count) : makeSteam(W, H, fx.count)
      for (const p of ps) {
        p.vx = p.vx * fx.scale.vx + (fx.kind === 'steam' ? fx.push ?? 0 : 0)
        p.vy *= fx.scale.vy
      }
      particles.current = drive(ps)
    }
    resize()
    window.addEventListener('resize', resize)

    const pointer = trackPointer()
    const trailPool = makeSparkPool(cfg.trail.cap)
    let trailAcc = 0
    let trailSlot = 0

    const loop = rafLoop((t) => {
      const m = pointer.state

      // Depth tilt: layers lean toward the cursor on their own transform channel.
      if (m.active && layerSetters.length) {
        const nx = (m.x / window.innerWidth - 0.5) * 2
        const ny = (m.y / window.innerHeight - 0.5) * 2
        for (const s of layerSetters) {
          s.x(nx * s.depth)
          s.y(ny * s.depth * 0.5)
        }
      }

      applyPointerForce(particles.current, m, cfg.pointer)

      ctx.globalAlpha = 0.4 + intensityRef.current * 0.6
      if (fx.kind === 'embers') drawEmbers(ctx, W, H, particles.current, t, fx.palette)
      else drawSteam(ctx, W, H, particles.current, t, isDark() ? fx.dark : fx.light)
      ctx.globalAlpha = 1

      // Cursor trail: spawn along the path, proportional to pointer speed.
      if (m.active && m.speed > cfg.trail.minSpeed) {
        trailAcc += cfg.trail.rate * Math.min(1, m.speed / 24)
        while (trailAcc >= 1) {
          trailAcc -= 1
          emitSpark(trailPool[trailSlot % cfg.trail.cap], m, cfg.trail)
          trailSlot++
        }
      }
      drawSparks(ctx, trailPool, t, cfg.trail.palette)

      pointer.decay()
    })
    loop.start()

    return () => {
      loop.stop()
      pointer.dispose()
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
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
