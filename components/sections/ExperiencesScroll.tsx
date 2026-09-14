'use client'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import gsap from '@/lib/gsap'
import { fxFull } from '@/lib/fx'
import Reveal from '@/components/ui/Reveal'
import PageHero, { type Crumb } from '@/components/ui/PageHero'
import ExperienceRow from '@/components/experience/ExperienceRow'
import type { ExperienceSlug } from '@/lib/nav'

export type ExperienceScrollItem = {
  slug: ExperienceSlug
  eyebrow: string
  title: string
  detail: string
  image: string
  icon: React.ReactNode
  exploreHref: string
}

// Tunable scroll budget per item-to-item transition. About.tsx found +=600
// barely enough for a single static pin-hold to read as intentional; each
// slot here needs both a read-hold AND a crossfade, so this is the starting
// point - tune after manual testing.
const PX_PER_TRANSITION = 600
const HOLD_UNITS = 6 // item at rest, readable, CTAs live
const TRANS_UNITS = 4 // crossfade into the next item
const SLOT_UNITS = HOLD_UNITS + TRANS_UNITS
const SCRUB_SECONDS = 1
const TEXT_SHIFT_PERCENT = 100

export default function ExperiencesScroll({
  heroTitle,
  heroSubtitle,
  heroImage,
  heroImageAlt,
  heroCrumbs,
  intro,
  items,
  exploreLabel,
  bookNowLabel,
  bookHref,
}: {
  heroTitle: string
  heroSubtitle?: string
  heroImage: string
  heroImageAlt: string
  heroCrumbs: Crumb[]
  intro: string
  items: ExperienceScrollItem[]
  exploreLabel: string
  bookNowLabel: string
  bookHref: string
}) {
  const mainRef = useRef<HTMLElement>(null)
  const imageStackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!fxFull()) return
    const main = mainRef.current
    if (!main) return

    const n = items.length
    const scrollLength = (n - 1) * PX_PER_TRANSITION

    const mm = gsap.matchMedia()

    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        // The Tailwind baseline (item 0 visible, the rest opacity-0/invisible)
        // becomes authoritative from here on via gsap.set(), mirroring
        // CinematicStory's setInitialStates().
        gsap.set('.exp-text[data-idx="0"], .exp-image[data-idx="0"]', { autoAlpha: 1, yPercent: 0 })
        gsap.utils.toArray<HTMLElement>('.exp-text', main).slice(1).forEach((el) =>
          gsap.set(el, { autoAlpha: 0, yPercent: TEXT_SHIFT_PERCENT }))
        gsap.utils.toArray<HTMLElement>('.exp-image', main).slice(1).forEach((el) =>
          gsap.set(el, { opacity: 0 }))

        const tl = gsap.timeline({
          scrollTrigger: {
            // Triggered off the image box (now a descendant of .exp-pin,
            // which also contains the full-size hero above it): scrolling
            // stays free until the portrait's bottom edge - plus a small
            // buffer - reaches the viewport bottom, then locks the whole
            // .exp-pin card right there. Since the hero above the image is
            // taller than the remaining headroom on most screens, the top
            // of the hero ends up above the viewport once locked - accepted
            // per product decision, rather than resizing the hero to fit.
            trigger: imageStackRef.current,
            start: 'bottom bottom-=40',
            end: '+=' + scrollLength,
            scrub: SCRUB_SECONDS,
            pin: '.exp-pin',
            // No ancestor of .exp-pin carries a GSAP transform (unlike
            // About.tsx's .about-left), so plain fixed pinning is correct -
            // explicit here so a future reader sees this was checked.
            pinType: 'fixed',
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        for (let i = 0; i < n - 1; i++) {
          const start = i * SLOT_UNITS + HOLD_UNITS
          const outText = `.exp-text[data-idx="${i}"]`
          const inText = `.exp-text[data-idx="${i + 1}"]`
          const outImg = `.exp-image[data-idx="${i}"]`
          const inImg = `.exp-image[data-idx="${i + 1}"]`

          tl.to(outText, { autoAlpha: 0, yPercent: -TEXT_SHIFT_PERCENT, duration: TRANS_UNITS, ease: 'power2.inOut' }, start)
          tl.fromTo(inText, { autoAlpha: 0, yPercent: TEXT_SHIFT_PERCENT }, { autoAlpha: 1, yPercent: 0, duration: TRANS_UNITS, ease: 'power2.inOut' }, start)
          tl.to(outImg, { opacity: 0, duration: TRANS_UNITS, ease: 'power1.inOut' }, start)
          tl.fromTo(inImg, { opacity: 0 }, { opacity: 1, duration: TRANS_UNITS, ease: 'power1.inOut' }, start)
        }
      }, main)

      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [items.length])

  return (
    <main ref={mainRef} className="relative">
      {/* ── Desktop cycling showcase — lg AND motion-safe only ──────────── */}
      <div className="exp-cycle-wrap hidden lg:motion-safe:block">
        <div className="exp-pin relative">
          {/* Full-size, unchanged from before - only .exp-pin is pinned, so
              the hero has to live inside it (not as an unpinned sibling) or
              it would just scroll away mid-cycle, leaving a permanent gap
              above the locked card. Kept at its original size per product
              decision, even though hero+quote+row together may now exceed
              one viewport on shorter screens (see note in the pin config). */}
          <PageHero title={heroTitle} subtitle={heroSubtitle} image={heroImage} imageAlt={heroImageAlt} crumbs={heroCrumbs} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
            <Reveal className="max-w-2xl mx-auto text-center mb-8 lg:mb-10">
              <p className="font-heading text-2xl sm:text-3xl leading-snug text-foreground/85">{intro}</p>
            </Reveal>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-stretch">
              {/* Image stack: one fixed-size box, N absolute layers, never moves */}
              <div ref={imageStackRef} className="exp-image-stack relative aspect-[4/3] rounded-2xl overflow-hidden" aria-hidden="true">
                {items.map((item, i) => (
                  <div key={item.slug} className={`exp-image absolute inset-0 ${i === 0 ? '' : 'opacity-0'}`} data-idx={i}>
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority={i === 0}
                      loading={i === 0 ? undefined : 'eager'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                  </div>
                ))}
              </div>

              {/* Text stack: one clipped slot sharing the image column's height, N absolute blocks */}
              <div className="exp-text-slot relative h-full overflow-hidden">
                {items.map((item, i) => (
                  <div
                    key={item.slug}
                    className={`exp-text absolute inset-0 flex flex-col justify-center ${i === 0 ? '' : 'opacity-0 invisible'}`}
                    data-idx={i}
                  >
                    <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] border border-foreground/10 flex items-center justify-center mb-5">{item.icon}</div>
                    <p className="font-sans uppercase tracking-[0.3em] text-foreground/50 text-xs mb-3">{item.eyebrow}</p>
                    <h2 className="font-heading text-2xl sm:text-3xl mb-4">{item.title}</h2>
                    <p className="font-sans text-foreground/60 leading-[1.85] text-base mb-6">{item.detail}</p>
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                      <Link
                        href={item.exploreHref}
                        className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-foreground border border-foreground/25 hover:border-foreground/60 px-5 py-2.5 rounded-full transition-all cursor-pointer"
                        data-cursor="view"
                      >
                        {exploreLabel} <ArrowRight size={15} />
                      </Link>
                      <Link
                        href={bookHref}
                        className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-foreground hover:gap-3 transition-all cursor-pointer"
                        data-cursor="view"
                      >
                        {bookNowLabel} <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fallback — mobile/tablet OR reduced motion: today's plain list ── */}
      <div className="exp-fallback-wrap lg:motion-safe:hidden">
        <PageHero title={heroTitle} subtitle={heroSubtitle} image={heroImage} imageAlt={heroImageAlt} crumbs={heroCrumbs} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <Reveal className="max-w-2xl mx-auto text-center mb-20">
            <p className="font-heading text-2xl sm:text-3xl leading-snug text-foreground/85">{intro}</p>
          </Reveal>
          <div className="space-y-20 lg:space-y-28">
            {items.map((item, i) => (
              <Reveal key={item.slug} className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                <ExperienceRow item={item} reversed={i % 2 === 1} exploreLabel={exploreLabel} bookNowLabel={bookNowLabel} bookHref={bookHref} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
