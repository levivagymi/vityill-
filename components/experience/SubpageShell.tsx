'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
import gsap from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import Magnetic from '@/components/ui/Magnetic'
import Reveal from '@/components/ui/Reveal'
import { href, experienceHref, EXPERIENCE_SLUGS, type ExperienceSlug } from '@/lib/nav'
import { prefersReducedMotion } from '@/lib/utils'
import type { Locale } from '@/lib/types'

/**
 * Shared layout for the immersive experience subpages. The scene (canvas or
 * static fallback) stays pinned via position:sticky while the editorial
 * content scrolls up over it — the page therefore has real scroll depth,
 * which is what drives each scene's intensity ScrollTrigger.
 */
export default function SubpageShell({
  slug,
  eyebrow,
  title,
  desc,
  detail,
  children,
}: {
  slug: ExperienceSlug
  eyebrow: string
  title: string
  desc: string
  detail: string
  children: React.ReactNode
}) {
  const dict = useDict()
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  // Cyclic window of three: every page recommends a different trio, and the
  // ring covers all experiences without flooding the footer with chips.
  const idx = EXPERIENCE_SLUGS.indexOf(slug)
  const others = Array.from(
    { length: 3 },
    (_, k) => EXPERIENCE_SLUGS[(idx + k + 1) % EXPERIENCE_SLUGS.length],
  )

  const copyRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // The pinned title block would otherwise show through around the card
    // rising over it. Fade it line by line, bottom-up, so each line is gone
    // before the card reaches it; scrubbed, so it returns on the way back.
    // Not gated on fxFull(): this is legibility, not decoration.
    const copy = copyRef.current
    if (!copy) return
    const reduced = prefersReducedMotion()
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>('[data-fade]', copy).reverse()
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          // Done by the time the card's top edge meets the block's top edge.
          end: () => `+=${copy.offsetHeight * 0.85}`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      lines.forEach((el, i) => tl.to(el, { opacity: 0, y: reduced ? 0 : -24 }, i * 0.15))
    }, copy)
    return () => ctx.revert()
  }, [])

  return (
    <main className="relative">
      {/* Pinned scene */}
      <div className="sticky top-0 h-svh overflow-hidden bg-background">
        {children}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5 z-[3] pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--background), transparent)' }}
        />

        <div ref={copyRef} className="absolute inset-x-0 bottom-0 z-[4] px-4 sm:px-6 lg:px-8 pb-14 sm:pb-16">
          <div className="max-w-7xl mx-auto">
            <p data-fade className="font-sans uppercase tracking-[0.3em] text-muted-foreground mb-3" style={{ fontSize: 'var(--step--1)' }}>
              {eyebrow}
            </p>
            <h1 data-fade className="font-heading text-foreground leading-[1.02] tracking-tight max-w-3xl" style={{ fontSize: 'var(--step-5)' }}>
              {title}
            </h1>
            <p data-fade className="font-sans text-muted-foreground leading-relaxed max-w-xl mt-4" style={{ fontSize: 'var(--step-0)' }}>
              {desc}
            </p>
            <p data-fade className="mt-8 flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              <ChevronDown size={13} aria-hidden /> {dict.experiences.scrollHint}
            </p>
          </div>
        </div>
      </div>

      {/* Editorial content scrolling over the scene */}
      {/* No footer on these pages — the bottom padding keeps enough scroll
          depth for the scene intensity and lets the card settle mid-screen. */}
      <section ref={sectionRef} className="relative z-10 px-4 sm:px-6 lg:px-8" style={{ paddingBottom: '30svh' }}>
        <div className="max-w-7xl mx-auto">
          <Reveal className="max-w-2xl">
            <div className="bg-card/90 backdrop-blur-md border border-foreground/10 rounded-2xl p-7 lg:p-10 shadow-2xl shadow-black/20">
              <p className="editorial-measure font-sans text-foreground leading-[1.85]" style={{ fontSize: 'var(--step-0)' }}>
                {detail}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-8">
                <Magnetic>
                  <Link
                    href={href(lang, 'booking')}
                    className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background font-sans font-semibold text-sm px-7 py-3.5 rounded-full transition-colors duration-200 cursor-pointer"
                    data-cursor="view"
                  >
                    {dict.experiences.bookCta} <ArrowRight size={15} aria-hidden />
                  </Link>
                </Magnetic>
                <Link
                  href={href(lang, 'experiences')}
                  className="inline-flex items-center gap-2 font-sans text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                  data-cursor="view"
                >
                  <ArrowLeft size={14} aria-hidden /> {dict.experiences.back}
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-14" delay={0.1}>
            <div className="flex flex-wrap gap-3">
              {others.map((s) => (
                <Link
                  key={s}
                  href={experienceHref(lang, s)}
                  className="inline-flex items-center gap-2 bg-card/70 backdrop-blur border border-foreground/15 hover:border-foreground/40 text-foreground hover:text-foreground font-sans text-sm px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer"
                  data-cursor="view"
                >
                  {dict.experiences[s].title} <ArrowRight size={13} aria-hidden />
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
