'use client'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import gsap, { ScrollTrigger } from '@/lib/gsap'

// Hungarian words for Phase 2 collision: ERDŐ (forest) vs CSEND (silence)
const CHARS_LEFT  = ['E', 'R', 'D', 'Ő']
const CHARS_RIGHT = ['C', 'S', 'E', 'N', 'D']

const CARDS = [
  {
    label: 'I.',
    heading: 'Ahol az\nerdő zúg',
    body: 'Szomód határán, ahol a Gerecse hegység szelíden öleli körül a völgyet.',
    src: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80&fit=crop',
  },
  {
    label: 'II.',
    heading: 'Tíz vendégnek\notthon',
    body: 'Faburkolatos terek, kandalló, jacuzzi — minden a teljes kikapcsolódásért.',
    src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&q=80&fit=crop',
  },
  {
    label: 'III.',
    heading: 'Gerecse\nszíve',
    body: 'Túraösvények kapujában, 70 km-re Budapesttől.',
    src: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80&fit=crop',
  },
]

// Phase 1 scatter vectors for each hero echo element
const SCATTER = [
  { x: -900, y: -500, rotation: -55 },
  { x:    0, y: -950, rotation:  18 },
  { x:    0, y: -800, rotation: -12 },
  { x: -650, y: -580, rotation:  30 },
  { x:  720, y: -680, rotation: -28 },
  { x:  860, y: -340, rotation:  22 },
]

// Phase 3 initial card distortions before they snap to clarity
const CARD_DISTORT = [
  { x: -300, skewX: -28, skewY:  8 },
  { x:    0, skewX:  22, skewY: -10 },
  { x:  300, skewX: -24, skewY:  10 },
]

export default function CinematicStory() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = ref.current
    if (!section) return

    // data-cinematic on <html> triggers CSS that hides the custom cursor rings
    const setCinematic = (on: boolean) => {
      if (on) document.documentElement.setAttribute('data-cinematic', 'true')
      else    document.documentElement.removeAttribute('data-cinematic')
    }

    const mm = gsap.matchMedia()

    // ── Full cinematic experience ────────────────────────────────────────────
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        // Centre dot and flash at true 50%/50% via GSAP so inline style doesn't fight transform
        gsap.set('.ce-dot',   { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 })
        gsap.set('.ce-flash', { xPercent: -50, yPercent: -50, scale: 1, opacity: 0 })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=4000',
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            onEnter:     () => setCinematic(true),
            onLeave:     () => setCinematic(false),
            onEnterBack: () => setCinematic(true),
            onLeaveBack: () => setCinematic(false),
          },
        })

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 1 — THE DROP  (0 → 2.5)
        // Hero echo zooms forward; each content element explodes outward
        // ═══════════════════════════════════════════════════════════════════
        tl.to('.ce-hero-bg',  { scale: 1.55, opacity: 0, duration: 2,   ease: 'power2.in' }, 0)
        tl.to('.ce-hero-dim', { opacity: 1,              duration: 1.2,  ease: 'none'      }, 0)

        gsap.utils.toArray<HTMLElement>('.ce-hero-el', section).forEach((el, i) => {
          const s = SCATTER[i % SCATTER.length]
          tl.to(el, {
            x: s.x, y: s.y, rotation: s.rotation,
            scale: 0, opacity: 0,
            duration: 1.8, ease: 'power3.in',
          }, i * 0.11)
        })

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 2 — CHAOS & DISRUPTION  (1.8 → 4.6)
        // Layered parallax debris; two massive words collide then shatter
        // ═══════════════════════════════════════════════════════════════════
        tl.fromTo('.ce-chaos', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 1.8)

        // Slow geometric lines drift through (bg layer, moves least)
        tl.fromTo('.ce-p-slow', { y: '-28%', opacity: 0 }, { y: '28%', opacity: 0.13, duration: 3   }, 1.9)
        // Fast dot constellation blasts through faster (fg layer)
        tl.fromTo('.ce-p-fast', { y: '-60%', opacity: 0 }, { y: '60%', opacity: 0.25, duration: 2.2 }, 2.1)

        // ERDŐ collides from the LEFT into upper collision zone (~30% from top)
        tl.fromTo('.ce-w1', { xPercent: -130, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.3, ease: 'power3.out' }, 2.3)
        // CSEND collides from the RIGHT into lower collision zone (~52% from top)
        tl.fromTo('.ce-w2', { xPercent:  130, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.3, ease: 'power3.out' }, 2.5)

        // ERDŐ chars shatter UPWARD after collision
        gsap.utils.toArray<HTMLElement>('.ce-w1 .ch', section).forEach((el, i) => {
          tl.to(el, {
            x: (i % 2 === 0 ? -1 : 1) * (80  + i * 140),
            y: -(210 + i * 95),
            rotation: (i % 2 === 0 ? -1 : 1) * (16 + i * 18),
            opacity: 0, duration: 1.1, ease: 'power2.in',
          }, 3.4 + i * 0.07)
        })
        // CSEND chars shatter DOWNWARD after collision
        gsap.utils.toArray<HTMLElement>('.ce-w2 .ch', section).forEach((el, i) => {
          tl.to(el, {
            x: (i % 2 === 0 ? 1 : -1) * (90  + i * 115),
            y:  220 + i * 88,
            rotation: (i % 2 === 0 ? 1 : -1) * (20 + i * 14),
            opacity: 0, duration: 1.1, ease: 'power2.in',
          }, 3.5 + i * 0.06)
        })

        tl.to('.ce-chaos', { opacity: 0, duration: 0.5 }, 4.3)

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 3 — METAMORPHOSIS  (4.5 → 7.2)
        // Light beam draws down center; distorted cards snap to clarity
        // ═══════════════════════════════════════════════════════════════════
        tl.fromTo('.ce-narrative', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 4.5)

        // Guide beam: scaleY 0→1 from top, feels like a light being drawn downward
        tl.fromTo('.ce-guide',
          { scaleY: 0, opacity: 0 },
          { scaleY: 1, opacity: 1, duration: 2, ease: 'power1.inOut' },
          4.8
        )

        gsap.utils.toArray<HTMLElement>('.ce-card', section).forEach((el, i) => {
          const d = CARD_DISTORT[i]
          tl.fromTo(el,
            { x: d.x, skewX: d.skewX, skewY: d.skewY, opacity: 0, scale: 0.62, y: 80 },
            { x: 0,   skewX: 0,        skewY: 0,        opacity: 1, scale: 1,    y: 0,
              duration: 1.15, ease: 'back.out(1.5)' },
            5.1 + i * 0.4
          )
          // Geometric debris bursts from behind each card as it snaps into place
          el.querySelectorAll<HTMLElement>('.ce-debris').forEach((d, j) => {
            tl.fromTo(d,
              { x: 0, y: 0, scale: 1, opacity: 0.9 },
              { x: (j % 2 === 0 ? 1 : -1) * (72 + j * 68),
                y: -(115 + j * 78), scale: 0.1, opacity: 0,
                duration: 0.9, ease: 'power1.out' },
              5.1 + i * 0.4
            )
          })
        })

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 4 — IMPLOSION & HANDOVER  (7.2 → 9)
        // All elements collapse to a point → brand-color flash fills screen
        // → fades to reveal About; cursor + scroll restored automatically
        // ═══════════════════════════════════════════════════════════════════
        gsap.utils.toArray<HTMLElement>('.ce-card', section).forEach((el, i) => {
          tl.to(el, { scale: 0, opacity: 0, duration: 0.75, ease: 'power4.in' }, 7.2 + i * 0.09)
        })
        tl.to('.ce-guide',     { scaleY: 0, opacity: 0, duration: 0.45 }, 7.35)
        tl.to('.ce-narrative', { opacity: 0,             duration: 0.3  }, 7.65)

        // Singularity dot pulses into existence
        tl.to('.ce-dot', { scale: 1,   opacity: 1, duration: 0.32, ease: 'back.out(4)' }, 7.78)
        tl.to('.ce-dot', { scale: 0.3,             duration: 0.22                       }, 8.1 )

        // Brand circle (20px) expands to scale:200 (≈4000px diameter) — covers all viewports
        tl.to('.ce-flash', { opacity: 1, scale: 200, duration: 0.5,  ease: 'power4.out'   }, 8.28)
        tl.to('.ce-flash', { opacity: 0,             duration: 0.75, ease: 'power1.inOut' }, 8.68)
      }, ref)

      return () => {
        setCinematic(false)
        ctx.revert()
      }
    })

    // ── Reduced-motion fallback: static narrative, no pinning ───────────────
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set('.ce-hero-echo', { opacity: 0 })
      gsap.set('.ce-chaos',     { opacity: 0 })
      gsap.set('.ce-narrative', { opacity: 1 })
      gsap.set('.ce-guide',     { scaleY: 1, opacity: 1 })
      gsap.utils.toArray<HTMLElement>('.ce-card', ref.current!).forEach((el) => {
        gsap.set(el, { opacity: 1, skewX: 0, skewY: 0, x: 0, y: 0, scale: 1 })
      })
    })

    const ro = new ResizeObserver(() => ScrollTrigger.refresh())
    ro.observe(section)

    return () => {
      mm.revert()
      ro.disconnect()
      setCinematic(false)
    }
  }, [])

  return (
    <section
      ref={ref}
      className="relative h-screen overflow-hidden"
      style={{ pointerEvents: 'none', cursor: 'none', backgroundColor: '#0a1a10' }}
      aria-hidden="true"
    >
      {/* ── PHASE 1: Hero Echo ─────────────────────────────────────────────── */}
      <div className="ce-hero-echo absolute inset-0">
        <div
          className="ce-hero-bg absolute inset-0 w-full h-[130%] -top-[15%]"
          style={{ willChange: 'transform' }}
        >
          <Image
            src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80&fit=crop"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-[#0a1f14]" style={{ opacity: 0.5 }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A4731]/30 via-transparent to-[#1A4731]/70" />
        {/* Dark curtain that closes over the echo as Phase 1 progresses */}
        <div
          className="ce-hero-dim absolute inset-0 bg-[#0a1a10]"
          style={{ opacity: 0, willChange: 'opacity' }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="ce-hero-el flex items-center gap-3 mb-6" style={{ willChange: 'transform' }}>
            <div className="h-px w-12 bg-[rgba(255,244,204,0.35)]" />
            <span className="text-[rgba(255,244,204,0.7)] text-xs font-sans uppercase tracking-[0.35em]">
              Gerecse · Szomód
            </span>
            <div className="h-px w-12 bg-[rgba(255,244,204,0.35)]" />
          </div>

          <h2
            className="ce-hero-el font-heading text-5xl sm:text-7xl lg:text-8xl text-[#FFF4CC] leading-none tracking-tight mb-3"
            style={{ willChange: 'transform' }}
          >
            Vityilló
          </h2>

          <p
            className="ce-hero-el font-heading text-2xl sm:text-3xl text-[rgba(255,244,204,0.75)] italic mb-5"
            style={{ willChange: 'transform' }}
          >
            Vendégház
          </p>

          <p
            className="ce-hero-el font-sans text-sm sm:text-base text-[rgba(255,244,204,0.55)] max-w-md leading-relaxed mb-10"
            style={{ willChange: 'transform' }}
          >
            Természet ölén, civilizáció közelében
          </p>

          <div
            className="ce-hero-el w-44 h-12 rounded-full border border-[rgba(255,244,204,0.3)] flex items-center justify-center"
            style={{ willChange: 'transform' }}
          >
            <span className="font-sans text-sm text-[rgba(255,244,204,0.6)] tracking-wide">
              Fedezd fel
            </span>
          </div>
        </div>
      </div>

      {/* ── PHASE 2: Chaos Layer ───────────────────────────────────────────── */}
      <div className="ce-chaos absolute inset-0" style={{ opacity: 0, willChange: 'opacity' }}>
        <div className="absolute inset-0 bg-[#050e08]" />

        {/* Slow parallax layer — tall geometric line fragments (background depth) */}
        <div className="ce-p-slow absolute inset-0 pointer-events-none" style={{ willChange: 'transform' }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${10 + i * 14}%`,
                top:  `${6  + i * 10}%`,
                width: 1,
                height: `${65 + i * 48}px`,
                background: 'rgba(255,244,204,0.18)',
                transform: `rotate(${-22 + i * 10}deg)`,
              }}
            />
          ))}
        </div>

        {/* Fast parallax layer — small dot constellation (foreground depth) */}
        <div className="ce-p-fast absolute inset-0 pointer-events-none" style={{ willChange: 'transform' }}>
          {Array.from({ length: 14 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left:   `${(i * 7.2) % 100}%`,
                top:    `${(i * 6.8) % 100}%`,
                width:  `${2 + (i % 4) * 2}px`,
                height: `${2 + (i % 4) * 2}px`,
                background: 'rgba(255,244,204,0.38)',
              }}
            />
          ))}
        </div>

        {/* ERDŐ — enters from LEFT, positioned in upper collision zone */}
        <div
          className="ce-w1 absolute"
          style={{
            top: '30%', left: 0, right: 0,
            display: 'flex', justifyContent: 'center',
            willChange: 'transform',
          }}
        >
          <div className="flex">
            {CHARS_LEFT.map((char, i) => (
              <span
                key={i}
                className="ch font-heading font-bold text-[#FFF4CC] inline-block select-none"
                style={{
                  fontSize: 'clamp(72px, 16vw, 175px)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  willChange: 'transform, opacity',
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* CSEND — enters from RIGHT, positioned in lower collision zone */}
        <div
          className="ce-w2 absolute"
          style={{
            top: '52%', left: 0, right: 0,
            display: 'flex', justifyContent: 'center',
            willChange: 'transform',
          }}
        >
          <div className="flex">
            {CHARS_RIGHT.map((char, i) => (
              <span
                key={i}
                className="ch font-heading font-bold inline-block select-none"
                style={{
                  fontSize: 'clamp(56px, 12vw, 138px)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: 'rgba(255,244,204,0.42)',
                  willChange: 'transform, opacity',
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PHASE 3: Narrative Layer ───────────────────────────────────────── */}
      <div
        className="ce-narrative absolute inset-0 bg-[#0f2318]"
        style={{ opacity: 0, willChange: 'opacity' }}
      >
        {/* Vertical light beam — transformOrigin:top so scaleY draws it downward */}
        <div
          className="ce-guide absolute"
          style={{
            left: '50%',
            top: 0,
            width: 1,
            height: '100%',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,244,204,0.55) 22%, rgba(255,244,204,0.55) 78%, transparent 100%)',
            transformOrigin: 'top center',
            transform: 'scaleY(0)',
            willChange: 'transform, opacity',
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center gap-3 sm:gap-5 lg:gap-8 px-3 sm:px-6">
          {CARDS.map((card, i) => (
            <div
              key={i}
              className="ce-card relative flex-1"
              style={{
                maxWidth: 260,
                minWidth: 72,
                aspectRatio: '3/4',
                opacity: 0,
                borderRadius: 16,
                overflow: 'hidden',
                willChange: 'transform, opacity',
              }}
            >
              {/* Debris particles — burst outward when card snaps in */}
              {[0, 1, 2].map((j) => (
                <div
                  key={j}
                  className="ce-debris absolute rounded-full bg-[#FFF4CC] pointer-events-none"
                  style={{
                    width: 7, height: 7,
                    left: `${22 + j * 28}%`,
                    top: '48%',
                    zIndex: 10,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}

              <Image
                src={card.src}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 30vw, 260px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a10]/92 via-[#0a1a10]/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5">
                <div
                  className="font-sans text-[rgba(255,244,204,0.45)] uppercase tracking-[0.2em] mb-1"
                  style={{ fontSize: 'clamp(8px, 1vw, 11px)' }}
                >
                  {card.label}
                </div>
                <h3
                  className="font-heading text-[#FFF4CC] leading-tight mb-1 sm:mb-2 whitespace-pre-line"
                  style={{ fontSize: 'clamp(13px, 2vw, 20px)' }}
                >
                  {card.heading}
                </h3>
                <p
                  className="font-sans text-[rgba(255,244,204,0.5)] leading-snug hidden sm:block"
                  style={{ fontSize: 'clamp(9px, 1.1vw, 12px)' }}
                >
                  {card.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PHASE 4: Implosion elements ────────────────────────────────────── */}
      {/* Singularity point — positioned via GSAP xPercent/yPercent in useEffect */}
      <div
        className="ce-dot absolute rounded-full bg-[#FFF4CC]"
        style={{ width: 12, height: 12, top: '50%', left: '50%', zIndex: 20, willChange: 'transform, opacity' }}
      />
      {/* Brand-color circle: expands to scale:200 (≈4000px ⌀) to fill any viewport */}
      <div
        className="ce-flash absolute rounded-full bg-[#1A4731]"
        style={{ width: 20, height: 20, top: '50%', left: '50%', zIndex: 30, willChange: 'transform, opacity' }}
      />
    </section>
  )
}
