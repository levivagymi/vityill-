'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowRight, CalendarDays } from 'lucide-react'
import gsap from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import Magnetic from '@/components/ui/Magnetic'
import SectionHeading from '@/components/ui/SectionHeading'
import { href } from '@/lib/nav'
import { prefersReducedMotion } from '@/lib/utils'
import {
  nextOpenWindows, openNightCount, weeksGrid, seasonOf,
  type OpenWindow, type DayStatus, type Season,
} from '@/lib/availability'
import { todayISO } from '@/lib/booking'
import type { Locale } from '@/lib/types'

const CELL_STYLE: Record<DayStatus, string> = {
  open: 'bg-foreground/15',
  held: 'bg-foreground/45',
  booked: 'bg-foreground/85',
}

/**
 * "Next open dates" strip fed by the curated calendar in lib/availability.ts.
 * Data is computed after mount (it depends on "today"), so SSR renders a
 * stable skeleton and no hydration mismatch is possible.
 */
export default function AvailabilityStrip({ compact = false }: { compact?: boolean }) {
  const dict = useDict()
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const sectionRef = useRef<HTMLElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)

  const [data, setData] = useState<{
    windows: OpenWindow[]
    openNights: number
    grid: { iso: string; status: DayStatus }[]
    season: Season
  } | null>(null)

  useEffect(() => {
    const from = todayISO()
    // One-time hydration from the browser clock after mount — computing
    // "today" during SSR/render would guarantee a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData({
      windows: nextOpenWindows(from, 3),
      openNights: openNightCount(from, 60),
      grid: weeksGrid(from, 8),
      season: seasonOf(from),
    })
  }, [])

  // Count-up + cell cascade on scroll-in; reduced motion snaps to final state.
  useEffect(() => {
    if (!data || !sectionRef.current) return
    const target = data.openNights
    const el = countRef.current
    if (prefersReducedMotion()) {
      if (el) el.textContent = String(target)
      return
    }
    const ctx = gsap.context(() => {
      if (el) {
        const counter = { n: 0 }
        gsap.to(counter, {
          n: target,
          duration: 1.4,
          ease: 'power2.out',
          snap: { n: 1 },
          onUpdate: () => { el.textContent = String(counter.n) },
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
      }
      gsap.fromTo('.avail-cell', { opacity: 0, scale: 0.4 }, {
        opacity: 1, scale: 1,
        stagger: { each: 0.006, from: 'start' },
        duration: 0.4,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.avail-grid', start: 'top 90%' },
      })
      gsap.fromTo('.avail-el', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [data])

  const seasonLabel: Record<Season, string> = {
    low: dict.availability.seasonLow,
    mid: dict.availability.seasonMid,
    high: dict.availability.seasonHigh,
  }

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric' }).format(new Date(iso))

  return (
    <section
      ref={sectionRef}
      aria-label={dict.availability.title}
      className={`relative overflow-hidden ${compact ? 'py-12' : 'py-24 lg:py-32'}`}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!compact && (
          <div className="avail-el mb-12 lg:mb-14">
            <SectionHeading
              label={dict.availability.label}
              title={dict.availability.title}
              subtitle={dict.availability.subtitle}
            />
          </div>
        )}

        <div className="avail-el grid lg:grid-cols-[1fr_auto] gap-10 items-center bg-foreground/[0.03] border border-foreground/[0.08] rounded-2xl p-7 lg:p-10">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider text-foreground/60 bg-foreground/[0.06] border border-foreground/10 rounded-full px-3 py-1.5">
                <CalendarDays size={12} aria-hidden />
                {data ? seasonLabel[data.season] : '—'}
              </span>
              <span className="font-sans text-xs uppercase tracking-wider text-foreground/45 bg-foreground/[0.04] border border-foreground/[0.08] rounded-full px-3 py-1.5">
                {dict.availability.minNights}
              </span>
            </div>

            <p className="font-sans text-sm text-foreground/55 mb-1">
              <span
                ref={countRef}
                className="font-heading text-4xl lg:text-5xl text-foreground font-semibold tabular-nums align-middle mr-2"
              >
                {prefersReducedMotion() && data ? data.openNights : 0}
              </span>
              {dict.availability.openNightsLabel}
            </p>

            <p className="font-sans text-xs uppercase tracking-[0.25em] text-foreground/35 mt-6 mb-3">
              {dict.availability.windowsTitle}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {(data?.windows ?? []).map((w) => (
                <Link
                  key={w.start}
                  href={href(lang, 'booking')}
                  data-cursor="view"
                  className="group inline-flex items-baseline gap-2 border border-foreground/15 hover:border-foreground/45 bg-background/50 rounded-full px-4 py-2 transition-colors duration-200 cursor-pointer"
                >
                  <span className="font-sans text-sm text-foreground/85">
                    {fmt(w.start)} → {fmt(w.end)}
                  </span>
                  <span className="font-sans text-xs text-foreground/40">
                    {w.nights} {dict.availability.night}
                  </span>
                </Link>
              ))}
              {!data &&
                Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className="h-9 w-40 rounded-full bg-foreground/[0.05]" aria-hidden />
                ))}
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-5">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-foreground/35 mb-2 lg:text-right">
                {dict.availability.weeksTitle}
              </p>
              <div className="avail-grid grid grid-flow-col grid-rows-7 gap-[3px]" aria-hidden>
                {(data?.grid ?? weeksGridSkeleton()).map(({ iso, status }) => (
                  <span
                    key={iso}
                    className={`avail-cell w-2.5 h-2.5 rounded-[3px] ${CELL_STYLE[status]}`}
                    title={iso}
                  />
                ))}
              </div>
              <div className="flex gap-4 mt-3 lg:justify-end">
                {(['open', 'held', 'booked'] as DayStatus[]).map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 font-sans text-[10px] text-foreground/45">
                    <span className={`w-2 h-2 rounded-[2px] ${CELL_STYLE[s]}`} aria-hidden />
                    {s === 'open' ? dict.availability.legendOpen : s === 'held' ? dict.availability.legendHeld : dict.availability.legendBooked}
                  </span>
                ))}
              </div>
            </div>

            {!compact && (
              <Magnetic>
                <Link
                  href={href(lang, 'booking')}
                  className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background font-sans font-semibold text-sm px-7 py-3.5 rounded-full transition-colors duration-200 cursor-pointer"
                  data-cursor="view"
                >
                  {dict.availability.checkDates} <ArrowRight size={15} aria-hidden />
                </Link>
              </Magnetic>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Stable skeleton for SSR + first client render (before "today" is known). */
function weeksGridSkeleton(): { iso: string; status: DayStatus }[] {
  return Array.from({ length: 56 }, (_, i) => ({ iso: `sk-${i}`, status: 'open' as DayStatus }))
}
