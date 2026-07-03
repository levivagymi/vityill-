'use client'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import gsap, { ScrollTrigger } from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'

// ── Types ─────────────────────────────────────────────────────────────────────
type Particle = {
  x: number; y: number; r: number
  vx: number; vy: number
  opacity: number; maxOpacity: number
  phase: number; wobble: number
}

// ── Static data ───────────────────────────────────────────────────────────────
const HERO_SCATTER = [
  { x: -900, y: -500, rotate: -55 },
  { x:    0, y: -950, rotate:  18 },
  { x: -350, y: -700, rotate: -12 },
  { x: -650, y: -580, rotate:  30 },
  { x:  720, y: -680, rotate: -28 },
  { x:  860, y: -340, rotate:  22 },
]


// Inline SVG floor plan — ground floor + first floor + details
const BLUEPRINT_PATHS = [
  'M 80 410 L 720 410 L 720 250 L 80 250 Z',
  'M 140 250 L 660 250 L 660 110 L 140 110 Z',
  'M 310 410 L 310 250', 'M 510 410 L 510 250',
  'M 80 330 L 310 330', 'M 510 330 L 720 330',
  'M 350 250 L 350 110', 'M 140 185 L 660 185',
  'M 195 410 L 195 380 L 240 380',
  'M 415 410 L 415 380 L 455 380',
  'M 175 250 L 175 215 L 215 215',
  'M 445 250 L 445 215 L 480 215',
  'M 110 275 L 195 275', 'M 580 275 L 680 275',
  'M 110 368 L 198 368', 'M 582 368 L 680 368',
  'M 168 138 L 258 138', 'M 432 138 L 530 138', 'M 582 138 L 648 138',
  'M 510 400 L 510 260',
  'M 510 393 L 540 393', 'M 510 377 L 540 377', 'M 510 361 L 540 361',
  'M 510 345 L 540 345', 'M 510 329 L 540 329', 'M 510 313 L 540 313',
  'M 510 297 L 540 297', 'M 510 281 L 540 281', 'M 510 265 L 540 265',
  'M 80 110 L 400 28 L 720 110',
  'M 558 110 L 558 52 L 600 52 L 600 110',
  'M 48 58 L 48 78', 'M 38 68 L 58 68',
]

const STARS = Array.from({ length: 90 }, (_, i) => ({
  left: `${(i * 13.73 + 3.1) % 100}%`,
  top:  `${(i * 11.31 + 2.4) % 66}%`,
  size:  1 + (i % 3),
}))

const PH8_IMGS = [
  { id: 'photo-1564013799919-ab600027ffc6', top: '8%',  left: '7%',  w: 128 },
  { id: 'photo-1448375240586-882707db888b', top: '7%',  left: '74%', w: 112 },
  { id: 'photo-1510798831971-661eb04b3739', top: '74%', left: '11%', w: 118 },
  { id: 'photo-1571896349842-33c89424de2d', top: '72%', left: '70%', w: 104 },
  { id: 'photo-1541123437800-1bb1317badc2', top: '41%', left: '2%',  w:  88 },
  { id: 'photo-1558618666-fcd25c85cd64',    top: '40%', left: '88%', w:  94 },
  { id: 'photo-1501854140801-50d01698950b', top: '19%', left: '42%', w:  98 },
  { id: 'photo-1555396273-367ea4eb4db5',    top: '67%', left: '43%', w: 108 },
]

// ── Canvas helpers ────────────────────────────────────────────────────────────
function makeSteam(w: number, h: number): Particle[] {
  return Array.from({ length: 60 }, () => ({
    x: Math.random() * w,
    y: h - Math.random() * h * 0.3,
    r: 3 + Math.random() * 8,
    vx: (Math.random() - 0.5) * 0.6,
    vy: -(0.5 + Math.random() * 1.5),
    opacity: 0.05 + Math.random() * 0.35,
    maxOpacity: 0.1 + Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
    wobble: 0.4 + Math.random() * 0.8,
  }))
}

function drawSteam(ctx: CanvasRenderingContext2D, w: number, h: number, ps: Particle[], t: number) {
  ctx.clearRect(0, 0, w, h)
  for (const p of ps) {
    p.x += p.vx + Math.sin(t * 0.0007 + p.phase) * p.wobble
    p.y += p.vy
    p.opacity -= 0.0012
    if (p.y < -30 || p.opacity < 0) {
      p.x = Math.random() * w; p.y = h + 10; p.opacity = p.maxOpacity
    }
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
    g.addColorStop(0, `rgba(210,235,255,${p.opacity})`)
    g.addColorStop(1, `rgba(210,235,255,0)`)
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = g; ctx.fill()
  }
}

const EC: [number, number, number][] = [[255,160,0],[255,100,0],[255,210,50],[220,80,10],[255,170,0]]

function makeEmbers(w: number, h: number): Particle[] {
  return Array.from({ length: 80 }, () => ({
    x: w * 0.3 + Math.random() * w * 0.4,
    y: h * 0.55 + Math.random() * h * 0.45,
    r: 1.5 + Math.random() * 4,
    vx: (Math.random() - 0.5) * 1.8,
    vy: -(1.2 + Math.random() * 3.5),
    opacity: 0.4 + Math.random() * 0.6,
    maxOpacity: 0.5 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    wobble: 1 + Math.random() * 2.5,
  }))
}

function drawEmbers(ctx: CanvasRenderingContext2D, w: number, h: number, ps: Particle[], t: number) {
  ctx.clearRect(0, 0, w, h)
  ps.forEach((p, i) => {
    p.x  += p.vx + Math.sin(t * 0.001 + p.phase) * p.wobble
    p.y  += p.vy
    p.opacity = Math.max(0.05, Math.min(p.maxOpacity, p.opacity + (Math.random() - 0.5) * 0.1))
    if (p.y < -15) {
      p.x = w * 0.3 + Math.random() * w * 0.4
      p.y = h * 0.6 + Math.random() * h * 0.35
      p.opacity = p.maxOpacity
    }
    const [r, g, b] = EC[i % EC.length]
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`; ctx.fill()
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
    glow.addColorStop(0, `rgba(${r},${g},${b},${p.opacity * 0.25})`)
    glow.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
    ctx.fillStyle = glow; ctx.fill()
  })
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CinematicStory() {
  const dict           = useDict()
  const sectionRef     = useRef<HTMLElement>(null)
  const steamCanvasRef = useRef<HTMLCanvasElement>(null)
  const emberCanvasRef = useRef<HTMLCanvasElement>(null)
  const steamRaf       = useRef(0)
  const emberRaf       = useRef(0)
  const steamOn        = useRef(false)
  const emberOn        = useRef(false)
  const steamPs        = useRef<Particle[]>([])
  const emberPs        = useRef<Particle[]>([])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const setCinematic = (on: boolean) =>
      on
        ? document.documentElement.setAttribute('data-cinematic', 'true')
        : document.documentElement.removeAttribute('data-cinematic')

    // ── Canvas loops ─────────────────────────────────────────────────────────
    // start/stop are idempotent: scrubbing back and forth re-fires the
    // timeline's onStart/onReverseComplete callbacks, and a second start
    // would otherwise spawn a parallel RAF loop that can never be cancelled.
    const startSteam = () => {
      if (steamOn.current) return
      const canvas = steamCanvasRef.current; if (!canvas) return
      const ctx = canvas.getContext('2d');   if (!ctx)    return
      const w = (canvas.width  = canvas.offsetWidth)
      const h = (canvas.height = canvas.offsetHeight)
      steamPs.current = makeSteam(w, h)
      steamOn.current = true
      const tick = (t: number) => { drawSteam(ctx, w, h, steamPs.current, t); steamRaf.current = requestAnimationFrame(tick) }
      steamRaf.current = requestAnimationFrame(tick)
    }
    const stopSteam = () => {
      steamOn.current = false
      cancelAnimationFrame(steamRaf.current)
    }

    const startEmbers = () => {
      if (emberOn.current) return
      const canvas = emberCanvasRef.current; if (!canvas) return
      const ctx = canvas.getContext('2d');   if (!ctx)    return
      const w = (canvas.width  = canvas.offsetWidth)
      const h = (canvas.height = canvas.offsetHeight)
      emberPs.current = makeEmbers(w, h)
      emberOn.current = true
      const tick = (t: number) => { drawEmbers(ctx, w, h, emberPs.current, t); emberRaf.current = requestAnimationFrame(tick) }
      emberRaf.current = requestAnimationFrame(tick)
    }
    const stopEmbers = () => {
      emberOn.current = false
      cancelAnimationFrame(emberRaf.current)
    }

    // ── Init SVG stroke-dash ─────────────────────────────────────────────────
    section.querySelectorAll<SVGPathElement>('.ph4-path').forEach(path => {
      const len = path.getTotalLength()
      path.style.strokeDasharray  = `${len}`
      path.style.strokeDashoffset = `${len}`
    })

    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {

        // ── Initial states ───────────────────────────────────────────────────
        gsap.set(['.ph2-layer','.ph3-layer','.ph4-layer','.ph5-layer',
                  '.ph6-layer','.ph7-layer','.ph8-layer'], { opacity: 0 })
        gsap.set('.ph1-house-img',  { scale: 4, opacity: 0, filter: 'blur(20px)' })
        gsap.set('.ph1-window',     { opacity: 0 })
        gsap.set('.ph4-letter',     { y: -120, opacity: 0 })
        gsap.set('.ph7-star',       { opacity: 0 })
        gsap.set('.ph6-silhouette', { yPercent: 150 })
        gsap.set('.ph8-asset',      { opacity: 0 })
        gsap.set('.ce-dot',  { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 })
        gsap.set('.ce-flash',{ xPercent: -50, yPercent: -50, scale: 1, opacity: 0 })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=12000',
            scrub: 1.5,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            // Only hide the cursor once the user actually starts scrolling (progress > 0).
            // At progress=0 (page load, before any scroll) the cursor stays visible so the
            // cookie banner and cinematic-prompt card are still navigable.
            onUpdate: (self) => setCinematic(self.progress > 0.002),
            onLeave:     () => setCinematic(false),
            onLeaveBack: () => setCinematic(false),
          },
        })

        // ════════════════════════════════════════════════════════════════════
        // PHASE 1 — HOUSE ARRIVAL  (0 → 12)
        // Hero elements scatter; house zooms from 3D depth; windows glow warm
        // ════════════════════════════════════════════════════════════════════
        gsap.utils.toArray<HTMLElement>('.ce-hero-el', section).forEach((el, i) => {
          const s = HERO_SCATTER[i % HERO_SCATTER.length]
          tl.to(el, {
            x: s.x, y: s.y, rotation: s.rotate,
            scale: 0.1, opacity: 0,
            duration: 3, ease: 'power3.in',
          }, i * 0.18)
        })

        tl.to('.ph1-house-img', {
          scale: 1, opacity: 1, filter: 'blur(0px)',
          duration: 5.5, ease: 'power2.out',
        }, 1.2)

        tl.to('.ph1-window', {
          opacity: 1, stagger: 0.35, duration: 2, ease: 'power2.inOut',
        }, 5.5)

        tl.to('.ce-hero-echo', { opacity: 0, duration: 2 }, 7)

        // ════════════════════════════════════════════════════════════════════
        // PHASE 2 — FOREST FLYTHROUGH  (9 → 24)
        // 5-layer parallax; closest trees blast to sides; fog drifts
        // ════════════════════════════════════════════════════════════════════
        tl.to('.ph2-layer', { opacity: 1, duration: 2 }, 9)

        tl.to('.ph2-l1-left',  { x: '-210%', scale: 2.5, duration: 7, ease: 'power1.inOut' }, 10.5)
        tl.to('.ph2-l1-right', { x:  '210%', scale: 2.5, duration: 7, ease: 'power1.inOut' }, 10.5)
        tl.fromTo('.ph2-l2', { x: '0%' }, { x: '-62%', duration: 8, ease: 'none' }, 10)
        tl.fromTo('.ph2-l3', { x: '0%' }, { x:  '52%', duration: 8, ease: 'none' }, 10)
        tl.fromTo('.ph2-l4', { x: '0%' }, { x: '-18%', duration: 9, ease: 'none' }, 10)
        tl.fromTo('.ph2-l5', { x: '0%' }, { x:  '13%', duration: 9, ease: 'none' }, 10)
        tl.fromTo('.ph2-fog', { x: '-6%' }, { x: '6%', duration: 9, ease: 'sine.inOut' }, 10)
        tl.to('.ph1-house-img', { scale: 1.22, opacity: 0.5, duration: 6, ease: 'power1.inOut' }, 10)

        // ════════════════════════════════════════════════════════════════════
        // PHASE 3 — WELLNESS & PURIFICATION  (21 → 36)
        // Vertical curtain clip-path closes forest; steam canvas; images snap to clarity
        // ════════════════════════════════════════════════════════════════════
        tl.to('.ph2-layer', {
          clipPath: 'polygon(50% 0%,50% 0%,50% 100%,50% 100%)',
          duration: 2.5, ease: 'power2.inOut',
        }, 21)
        tl.to('.ph2-layer', { opacity: 0, duration: 0.4 }, 23.2)

        tl.to('.ph3-layer', {
          opacity: 1, duration: 1.5,
          onStart: startSteam,
          onReverseComplete: stopSteam,
        }, 22)

        tl.fromTo('.ph3-jacuzzi', {
          x: -280, skewX: -20, rotation: -10, scale: 0.5, opacity: 0,
        }, {
          x: 0, skewX: 0, rotation: 0, scale: 1, opacity: 1,
          duration: 3, ease: 'back.out(1.4)',
        }, 23.5)

        tl.fromTo('.ph3-sauna', {
          x: 280, skewX: 20, rotation: 10, scale: 0.5, opacity: 0,
        }, {
          x: 0, skewX: 0, rotation: 0, scale: 1, opacity: 1,
          duration: 3, ease: 'back.out(1.4)',
        }, 24.2)

        tl.to('.ph3-layer', {
          opacity: 0, duration: 1.5,
          onComplete: stopSteam,
          onReverseComplete: startSteam,
        }, 34.5)

        // ════════════════════════════════════════════════════════════════════
        // PHASE 4 — ACCOMMODATIONS & BLUEPRINTS  (33 → 48)
        // SVG floor-plan draws in via strokeDashoffset; elastic letter cascade
        // ════════════════════════════════════════════════════════════════════
        tl.to('.ph4-layer', { opacity: 1, duration: 1.5 }, 33)

        section.querySelectorAll<SVGPathElement>('.ph4-path').forEach((path, i) => {
          tl.to(path, {
            strokeDashoffset: 0,
            duration: 1.4 + (i % 4) * 0.28,
            ease: 'power1.inOut',
          }, 34.5 + i * 0.15)
        })

        tl.to('.ph4-l1 .ph4-letter', {
          y: 0, opacity: 1,
          stagger: { each: 0.07, from: 'start' },
          duration: 0.9, ease: 'elastic.out(1,0.4)',
        }, 39.5)

        tl.to('.ph4-l2 .ph4-letter', {
          y: 0, opacity: 1,
          stagger: { each: 0.055, from: 'start' },
          duration: 0.9, ease: 'elastic.out(1,0.4)',
        }, 41)

        tl.to('.ph4-svg-wrap', {
          scaleX: 0.01, scaleY: 0.01, opacity: 0,
          transformOrigin: 'center center',
          duration: 1.8, ease: 'power3.in',
        }, 46)
        tl.to('.ph4-letters-wrap', { opacity: 0, duration: 1 }, 46.2)
        tl.to('.ph4-layer',        { opacity: 0, duration: 1 }, 47)

        // ════════════════════════════════════════════════════════════════════
        // PHASE 5 — PREMIUM DETAILS & TEXTURE  (45 → 60)
        // Circular mask expands from center; text slides in opposite direction
        // ════════════════════════════════════════════════════════════════════
        tl.to('.ph5-layer', { opacity: 1, duration: 1.5 }, 45)

        tl.fromTo('.ph5-mask', {
          clipPath: 'circle(0% at 50% 50%)',
        }, {
          clipPath: 'circle(78% at 50% 50%)',
          duration: 6, ease: 'power2.inOut',
        }, 46.5)

        tl.fromTo('.ph5-text', {
          x: '42%', opacity: 0,
        }, {
          x: '-4%', opacity: 1,
          duration: 5.5, ease: 'power2.out',
        }, 47.5)

        tl.to('.ph5-mask', {
          clipPath: 'circle(0% at 50% 50%)',
          duration: 2, ease: 'power3.in',
        }, 58)
        tl.to('.ph5-layer', { opacity: 0, duration: 1.5 }, 58.5)

        // ════════════════════════════════════════════════════════════════════
        // PHASE 6 — GASTRONOMY & FIRE  (57 → 72)
        // Ember canvas; bogrács silhouette rises from bottom; campfire glow
        // ════════════════════════════════════════════════════════════════════
        tl.to('.ph6-layer', {
          opacity: 1, duration: 1.5,
          onStart: startEmbers,
          onReverseComplete: stopEmbers,
        }, 57)

        tl.to('.ph6-silhouette', {
          yPercent: 0, duration: 5.5, ease: 'power2.out',
        }, 58.5)

        // Fire flicker via keyframes — works correctly with scrub
        tl.to('.ph6-glow', {
          keyframes: [
            { opacity: 0.88, duration: 0.55 }, { opacity: 0.38, duration: 0.5  },
            { opacity: 0.92, duration: 0.6  }, { opacity: 0.42, duration: 0.65 },
            { opacity: 0.85, duration: 0.5  }, { opacity: 0.4,  duration: 0.55 },
            { opacity: 0.9,  duration: 0.45 }, { opacity: 0.45, duration: 0.6  },
            { opacity: 0.82, duration: 0.5  },
          ],
          ease: 'none',
        }, 61)

        tl.to('.ph6-layer', {
          opacity: 0, duration: 1.5,
          onComplete: stopEmbers,
          onReverseComplete: startEmbers,
        }, 70.5)

        // ════════════════════════════════════════════════════════════════════
        // PHASE 7 — NIGHT & ATMOSPHERE  (69 → 84)
        // Stars fade in; house night-graded; pathway lights; moon lens flare
        // ════════════════════════════════════════════════════════════════════
        tl.to('.ph7-layer', { opacity: 1, duration: 2 }, 69)

        tl.to('.ph7-star', {
          opacity: (i) => 0.22 + (i % 7) * 0.12,
          stagger: { each: 0.018, from: 'random' },
          duration: 2.5, ease: 'power1.inOut',
        }, 70.5)

        tl.fromTo('.ph7-house', {
          scale: 0.88, opacity: 0, filter: 'brightness(0.15) saturate(0.2)',
        }, {
          scale: 1, opacity: 1, filter: 'brightness(1) saturate(1)',
          duration: 4, ease: 'power2.out',
        }, 71.5)

        tl.to('.ph7-path-light', {
          opacity: 1, stagger: 0.3, duration: 2, ease: 'power2.inOut',
        }, 73.5)

        tl.fromTo('.ph7-moon-glow', {
          x: '-50%', opacity: 0,
        }, {
          x: '150%', opacity: 1,
          duration: 4.5, ease: 'sine.inOut',
        }, 76)
        tl.to('.ph7-moon-glow', { opacity: 0, duration: 1.2 }, 80)
        tl.to('.ph7-layer', { opacity: 0, duration: 2 }, 82)

        // ════════════════════════════════════════════════════════════════════
        // PHASE 8 — IMPLOSION & DIMENSIONAL HANDOVER  (81 → 96)
        // All assets vortex to center; singularity dot; big-bang cream flash
        // ════════════════════════════════════════════════════════════════════
        tl.to('.ph8-layer', { opacity: 1, duration: 1 }, 81)

        tl.to('.ph8-asset', {
          opacity: 1, duration: 0.5,
          stagger: { each: 0.06, from: 'random' },
        }, 82)

        tl.to('.ph8-asset', {
          scale: 0, rotation: 720,
          opacity: 0, filter: 'blur(10px)',
          xPercent: () => gsap.utils.random(-30, 30),
          yPercent: () => gsap.utils.random(-30, 30),
          stagger: { each: 0.045, from: 'random' },
          duration: 3.5, ease: 'power4.in',
        }, 84)

        tl.to('.ce-dot', { scale: 1,    opacity: 1, duration: 0.4, ease: 'back.out(4)' }, 87.5)
        tl.to('.ce-dot', { scale: 0.25, duration: 0.3 }, 88)

        tl.to('.ce-flash', { opacity: 1, scale: 220, duration: 0.55, ease: 'power4.out'   }, 88.3)
        tl.to('.ce-flash', { opacity: 0,             duration: 1.5,  ease: 'power1.inOut' }, 88.9)

      }, sectionRef)

      return () => {
        stopSteam(); stopEmbers(); setCinematic(false); ctx.revert()
      }
    })

    // ── Reduced-motion fallback ───────────────────────────────────────────────
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set('.ce-hero-echo',                         { opacity: 0 })
      gsap.set('.ph3-layer',                            { opacity: 1 })
      gsap.set('.ph3-jacuzzi,.ph3-sauna',               { x: 0, skewX: 0, rotation: 0, scale: 1, opacity: 1 })
      gsap.set('.ph1-house-img',                        { scale: 1, opacity: 1, filter: 'blur(0px)' })
      gsap.set('.ph1-window',                           { opacity: 1 })
    })

    const ro = new ResizeObserver(() => ScrollTrigger.refresh())
    ro.observe(section)

    return () => {
      mm.revert(); ro.disconnect()
      stopSteam(); stopEmbers(); setCinematic(false)
    }
  }, [])

  const typo1 = dict.cinematic.floors.split('')
  const typo2 = dict.cinematic.guests.split('')

  return (
    <section
      ref={sectionRef}
      className="relative h-dvh overflow-hidden"
      style={{ pointerEvents: 'none', cursor: 'none', userSelect: 'none', backgroundColor: '#0a1a10' }}
      aria-hidden="true"
    >

      {/* ── PH1: Hero Echo — starting state, elements scatter on scroll ──── */}
      <div className="ce-hero-echo absolute inset-0" style={{ zIndex: 1 }}>
        <div className="absolute inset-0 bg-[#0a1a10]" />
        <div className="absolute inset-0 w-full h-[130%] -top-[15%]" style={{ willChange: 'transform' }}>
          <Image
            src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80&fit=crop"
            alt="" fill priority className="object-cover" sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A4731]/40 via-transparent to-[#0a1a10]/80" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="ce-hero-el flex items-center gap-3 mb-6" style={{ willChange: 'transform' }}>
            <div className="h-px w-12 bg-[rgba(255,244,204,.35)]" />
            <span className="font-sans text-[rgba(255,244,204,.7)] text-xs uppercase tracking-[.35em]">Gerecse · Szomód</span>
            <div className="h-px w-12 bg-[rgba(255,244,204,.35)]" />
          </div>
          <h2 className="ce-hero-el font-heading text-5xl sm:text-7xl lg:text-8xl text-[#FFF4CC] leading-none tracking-tight mb-3"
            style={{ willChange: 'transform' }}>
            Vityilló
          </h2>
          <p className="ce-hero-el font-heading text-2xl sm:text-3xl text-[rgba(255,244,204,.72)] italic mb-5"
            style={{ willChange: 'transform' }}>
            Vendégház
          </p>
          <p className="ce-hero-el font-sans text-sm sm:text-base text-[rgba(255,244,204,.52)] max-w-md leading-relaxed mb-10"
            style={{ willChange: 'transform' }}>
            {dict.cinematic.tagline}
          </p>
          <div className="ce-hero-el w-44 h-12 rounded-full border border-[rgba(255,244,204,.28)] flex items-center justify-center"
            style={{ willChange: 'transform' }}>
            <span className="font-sans text-sm text-[rgba(255,244,204,.55)] tracking-wide">{dict.cinematic.explore}</span>
          </div>
        </div>
      </div>

      {/* ── PH1: House image — zooms in from depth, windows glow warm ──────── */}
      <div className="ph1-house-img absolute inset-0" style={{ zIndex: 2, willChange: 'transform,opacity,filter' }}>
        <Image
          src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=90&fit=crop"
          alt="" fill className="object-cover" sizes="100vw" priority
        />
        <div className="ph1-window absolute" style={{
          top: '36%', left: '33%', width: '11%', height: '7%', borderRadius: 4, willChange: 'opacity',
          background: 'radial-gradient(ellipse,rgba(255,244,204,.78) 0%,rgba(255,200,80,.22) 62%,transparent 100%)',
        }} />
        <div className="ph1-window absolute" style={{
          top: '36%', left: '54%', width: '10%', height: '7%', borderRadius: 4, willChange: 'opacity',
          background: 'radial-gradient(ellipse,rgba(255,244,204,.72) 0%,rgba(255,200,80,.18) 62%,transparent 100%)',
        }} />
        <div className="ph1-window absolute" style={{
          top: '53%', left: '28%', width: '14%', height: '9%', borderRadius: 4, willChange: 'opacity',
          background: 'radial-gradient(ellipse,rgba(255,244,204,.52) 0%,rgba(255,200,80,.14) 68%,transparent 100%)',
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a10]/75 via-transparent to-[#0a1a10]/88" />
      </div>

      {/* ── PH2: Forest — 5-layer parallax ─────────────────────────────────── */}
      <div className="ph2-layer absolute inset-0"
        style={{ zIndex: 3, clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)', willChange: 'opacity,clip-path' }}>
        <div className="absolute inset-0 bg-[#040c07]" />
        <div className="ph2-l5 absolute inset-0" style={{ willChange: 'transform' }}>
          <Image src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&q=65&fit=crop"
            alt="" fill className="object-cover opacity-35" sizes="100vw" />
        </div>
        <div className="ph2-l4 absolute inset-0" style={{ willChange: 'transform' }}>
          <Image src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=68&fit=crop"
            alt="" fill className="object-cover opacity-50" sizes="100vw" />
        </div>
        <div className="ph2-l3 absolute" style={{ top: '-8%', left: '-15%', width: '130%', height: '116%', willChange: 'transform' }}>
          <Image src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=72&fit=crop"
            alt="" fill className="object-cover opacity-65" sizes="130vw" />
        </div>
        <div className="ph2-l2 absolute" style={{ top: '-5%', left: '-8%', width: '116%', height: '110%', willChange: 'transform' }}>
          <Image src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&q=78&fit=crop"
            alt="" fill className="object-cover" sizes="116vw" />
        </div>
        {/* Layer 1: split L/R so they blast to opposite sides */}
        <div className="ph2-l1-left absolute inset-0" style={{ clipPath: 'inset(0 50% 0 0)', willChange: 'transform' }}>
          <Image src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=88&fit=crop"
            alt="" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="ph2-l1-right absolute inset-0" style={{ clipPath: 'inset(0 0 0 50%)', willChange: 'transform' }}>
          <Image src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=88&fit=crop"
            alt="" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="ph2-fog absolute inset-0 pointer-events-none" style={{
          willChange: 'transform',
          background: 'linear-gradient(to bottom,transparent 0%,rgba(210,240,230,.13) 48%,transparent 100%)',
        }} />
      </div>

      {/* ── PH3: Wellness — steam canvas + jacuzzi/sauna ────────────────────── */}
      <div className="ph3-layer absolute inset-0" style={{ zIndex: 4, backgroundColor: '#050e08', willChange: 'opacity' }}>
        <canvas ref={steamCanvasRef} className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1, pointerEvents: 'none' }} />
        <div className="absolute inset-0 flex items-center justify-center gap-4 sm:gap-8 px-4" style={{ zIndex: 2 }}>
          <div className="ph3-jacuzzi relative flex-1 rounded-2xl overflow-hidden"
            style={{ maxWidth: 430, aspectRatio: '4/3', willChange: 'transform,opacity' }}>
            <Image src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=860&q=85&fit=crop"
              alt="" fill className="object-cover" sizes="430px" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060f08]/88 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="font-heading text-[#FFF4CC] text-xl sm:text-2xl">{dict.cinematic.jacuzzi}</p>
              <p className="font-sans text-[rgba(255,244,204,.48)] text-xs mt-1">{dict.cinematic.jacuzziDesc}</p>
            </div>
          </div>
          <div className="ph3-sauna relative flex-1 rounded-2xl overflow-hidden"
            style={{ maxWidth: 430, aspectRatio: '4/3', willChange: 'transform,opacity' }}>
            <Image src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=860&q=85&fit=crop"
              alt="" fill className="object-cover" sizes="430px" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060f08]/88 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="font-heading text-[#FFF4CC] text-xl sm:text-2xl">{dict.cinematic.sauna}</p>
              <p className="font-sans text-[rgba(255,244,204,.48)] text-xs mt-1">{dict.cinematic.saunaDesc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── PH4: Blueprint ──────────────────────────────────────────────────── */}
      <div className="ph4-layer absolute inset-0" style={{ zIndex: 5, backgroundColor: '#020609', willChange: 'opacity' }}>
        <div className="ph4-svg-wrap absolute inset-0 flex items-center justify-center" style={{ willChange: 'transform,opacity' }}>
          <svg viewBox="20 20 760 420" className="w-full max-w-2xl h-auto px-4"
            style={{ filter: 'drop-shadow(0 0 12px rgba(100,180,255,.38))' }}>
            {BLUEPRINT_PATHS.map((d, i) => (
              <path key={i} className="ph4-path" d={d} fill="none"
                stroke={i < 2 ? 'rgba(120,188,255,.92)' : 'rgba(100,168,255,.65)'}
                strokeWidth={i < 2 ? 2.5 : 1.5}
                strokeLinecap="round" strokeLinejoin="round"
              />
            ))}
            <text x="145" y="348" fill="rgba(100,180,255,.42)" fontSize="10" fontFamily="monospace">NAPPALI</text>
            <text x="335" y="348" fill="rgba(100,180,255,.42)" fontSize="10" fontFamily="monospace">HÁLÓSZOBA</text>
            <text x="535" y="348" fill="rgba(100,180,255,.42)" fontSize="10" fontFamily="monospace">KONYHA</text>
            <text x="158" y="218" fill="rgba(100,180,255,.42)" fontSize="10" fontFamily="monospace">FÜRDŐ</text>
            <text x="398" y="168" fill="rgba(100,180,255,.42)" fontSize="9"  fontFamily="monospace">HÁLÓSZOBA 2</text>
          </svg>
        </div>
        <div className="ph4-letters-wrap absolute inset-0 flex flex-col items-center justify-end pb-20 gap-4"
          style={{ willChange: 'opacity' }}>
          <div className="ph4-l1 flex items-baseline overflow-hidden" aria-label={dict.cinematic.floors}>
            {typo1.map((ch, i) => (
              <span key={i} className="ph4-letter font-heading text-[#FFF4CC] inline-block"
                style={{ fontSize: 'clamp(44px,8vw,88px)', lineHeight: 1, letterSpacing: '-0.02em', willChange: 'transform,opacity' }}>
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </div>
          <div className="ph4-l2 flex items-baseline overflow-hidden" aria-label={dict.cinematic.guests}>
            {typo2.map((ch, i) => (
              <span key={i} className="ph4-letter font-sans text-[rgba(255,244,204,.38)] inline-block uppercase tracking-[.22em]"
                style={{ fontSize: 'clamp(13px,2.1vw,22px)', willChange: 'transform,opacity' }}>
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PH5: Texture & Craftsmanship ────────────────────────────────────── */}
      <div className="ph5-layer absolute inset-0" style={{ zIndex: 6, backgroundColor: '#060e07', willChange: 'opacity' }}>
        <div className="ph5-mask absolute inset-0" style={{ clipPath: 'circle(0% at 50% 50%)', willChange: 'clip-path' }}>
          <div className="absolute inset-0 grid grid-cols-3">
            <div className="relative overflow-hidden">
              <Image src="https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=640&q=82&fit=crop"
                alt="" fill className="object-cover" sizes="33vw" />
            </div>
            <div className="relative overflow-hidden">
              <Image src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=82&fit=crop"
                alt="" fill className="object-cover" sizes="33vw" />
            </div>
            <div className="relative overflow-hidden">
              <Image src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=640&q=82&fit=crop"
                alt="" fill className="object-cover" sizes="33vw" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a10]/38 to-[#0a1a10]/58" />
        </div>
        <div className="ph5-text absolute inset-0 flex flex-col items-start justify-center pl-[54%]"
          style={{ willChange: 'transform,opacity' }}>
          <p className="font-sans text-[rgba(255,244,204,.36)] uppercase tracking-[.35em] mb-3"
            style={{ fontSize: 10 }}>
            {dict.cinematic.materialsLabel}
          </p>
          <h2 className="font-heading text-[#FFF4CC] leading-tight whitespace-pre-line" style={{ fontSize: 'clamp(24px,3.8vw,50px)' }}>
            {dict.cinematic.materialsTitle}
          </h2>
        </div>
      </div>

      {/* ── PH6: Gastronomy & Fire ───────────────────────────────────────────── */}
      <div className="ph6-layer absolute inset-0" style={{ zIndex: 7, backgroundColor: '#040804', willChange: 'opacity' }}>
        <canvas ref={emberCanvasRef} className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1, pointerEvents: 'none' }} />
        <div className="ph6-silhouette absolute bottom-0 left-0 right-0" style={{ zIndex: 2, willChange: 'transform' }}>
          <div className="relative w-full" style={{ aspectRatio: '21/8' }}>
            <Image src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&q=85&fit=crop"
              alt="" fill className="object-cover object-top" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#040804]/88" />
          </div>
        </div>
        <div className="ph6-glow absolute inset-x-0 bottom-0 pointer-events-none" style={{
          height: '55%', zIndex: 3, opacity: 0.32, willChange: 'opacity',
          background: 'radial-gradient(ellipse 70% 100% at 50% 100%,rgba(255,88,0,.52) 0%,rgba(255,45,0,.26) 45%,transparent 100%)',
        }} />
        <div className="absolute top-[22%] left-0 right-0 text-center" style={{ zIndex: 4 }}>
          <p className="font-sans text-[rgba(255,244,204,.3)] uppercase tracking-[.4em] mb-3" style={{ fontSize: 10 }}>
            {dict.cinematic.gastroLabel}
          </p>
          <h2 className="font-heading text-[#FFF4CC]" style={{ fontSize: 'clamp(28px,5vw,60px)' }}>
            {dict.cinematic.gastroTitle}
          </h2>
        </div>
      </div>

      {/* ── PH7: Night & Atmosphere ──────────────────────────────────────────── */}
      <div className="ph7-layer absolute inset-0" style={{ zIndex: 8, backgroundColor: '#020308', willChange: 'opacity' }}>
        {STARS.map((s, i) => (
          <div key={i} className="ph7-star absolute rounded-full bg-white"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, opacity: 0, willChange: 'opacity' }} />
        ))}
        <div className="ph7-house absolute inset-0" style={{ willChange: 'transform,opacity,filter' }}>
          <Image src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=85&fit=crop"
            alt="" fill className="object-cover" sizes="100vw"
            style={{ filter: 'saturate(0.25) brightness(0.28) hue-rotate(215deg)' }} />
          <div className="absolute inset-0 bg-[#020308]/52" />
          {[8, 24, 40, 57, 74, 90].map((pos, i) => (
            <div key={i} className="ph7-path-light absolute rounded-full" style={{
              bottom: '14%', left: `${pos}%`,
              width: 6, height: 6, opacity: 0, willChange: 'opacity',
              background: 'radial-gradient(circle,#FFF4CC 0%,rgba(255,244,204,.28) 55%,transparent 100%)',
              boxShadow: '0 0 16px 6px rgba(255,244,204,.26)',
            }} />
          ))}
        </div>
        <div className="ph7-moon-glow absolute pointer-events-none" style={{
          top: '7%', width: 160, height: 160, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(255,244,204,.58) 0%,rgba(255,244,204,.16) 48%,transparent 100%)',
          filter: 'blur(22px)', willChange: 'transform,opacity',
        }} />
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-center" style={{ zIndex: 10 }}>
          <p className="font-sans text-[rgba(255,244,204,.26)] uppercase tracking-[.45em]" style={{ fontSize: 10 }}>
            {dict.cinematic.nightLabel}
          </p>
        </div>
      </div>

      {/* ── PH8: Implosion — assets from all phases vortex to center ─────────── */}
      <div className="ph8-layer absolute inset-0" style={{ zIndex: 9, backgroundColor: '#0a1a10', willChange: 'opacity' }}>
        {PH8_IMGS.map((a, i) => (
          <div key={i} className="ph8-asset absolute overflow-hidden rounded-xl"
            style={{ top: a.top, left: a.left, width: a.w, height: Math.round(a.w * 0.75), willChange: 'transform,opacity,filter' }}>
            <Image src={`https://images.unsplash.com/${a.id}?w=240&q=60&fit=crop`}
              alt="" fill className="object-cover" sizes={`${a.w}px`} />
          </div>
        ))}
        {dict.cinematic.words.map((word, i) => (
          <div key={i} className="ph8-asset absolute font-heading text-[#FFF4CC] pointer-events-none select-none"
            style={{
              top:  `${12 + i * 13}%`,
              left: `${18 + (i % 3) * 28}%`,
              fontSize: 26 + (i % 3) * 10,
              opacity: 0, willChange: 'transform,opacity,filter',
            }}>
            {word}
          </div>
        ))}
      </div>

      {/* ── Singularity dot & cream flash — always on top ───────────────────── */}
      <div className="ce-dot absolute rounded-full bg-[#FFF4CC]"
        style={{ width: 12, height: 12, top: '50%', left: '50%', zIndex: 20, willChange: 'transform,opacity' }} />
      <div className="ce-flash absolute rounded-full bg-[#FFF4CC]"
        style={{ width: 20, height: 20, top: '50%', left: '50%', zIndex: 21, willChange: 'transform,opacity' }} />

    </section>
  )
}
