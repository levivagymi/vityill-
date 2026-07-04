'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import gsap, { ScrollTrigger } from '@/lib/gsap'
import { useLenis } from '@/components/engine/LenisProvider'
import { useDict } from '@/components/providers/DictProvider'
import { prefersReducedMotion } from '@/lib/utils'

type Chapter = { id: string; label: string }

/**
 * Thin top progress bar on every long page, plus a right-edge chapter dot
 * rail on the homepage (driven by the section ids the main nav already
 * targets). Both are transform/opacity-only and hidden while the cinematic
 * section owns the viewport (globals.css, [data-cinematic]).
 */
export default function ScrollProgress() {
  const dict = useDict()
  const pathname = usePathname()
  const lenis = useLenis()
  const barRef = useRef<HTMLDivElement>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [activeId, setActiveId] = useState('')
  const [visible, setVisible] = useState(false)

  const chapterLabels: Record<string, string> = {
    rolunk: dict.nav.about,
    amenities: dict.nav.amenities,
    rooms: dict.nav.rooms,
    gallery: dict.nav.gallery,
    testimonials: dict.testimonials.title,
    location: dict.nav.location,
  }

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return

    // One-time DOM measurement per route — page length and section presence
    // only exist in the browser after the new route has painted.
    const long = document.documentElement.scrollHeight > window.innerHeight * 2
    setVisible(long)
    if (!long) return

    gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' })
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
    })

    // Chapter rail: discover the homepage sections that actually exist —
    // same one-time-per-route DOM measurement as the length check above.
    const found: Chapter[] = Object.keys(chapterLabels)
      .map((id) => ({ id, label: chapterLabels[id] }))
      .filter(({ id }) => document.getElementById(id))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChapters(found)

    const spy = found.map(({ id }) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) setActiveId(id)
        },
      }),
    )

    return () => {
      st.kill()
      spy.forEach((s) => s.kill())
    }
    // Re-measure per route; labels are stable per dict.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const jump = (id: string) => {
    if (prefersReducedMotion()) {
      document.getElementById(id)?.scrollIntoView()
      return
    }
    lenis?.scrollTo(`#${id}`, { offset: -70 })
  }

  return (
    <>
      <div
        aria-hidden
        className="scroll-progress fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div
          ref={barRef}
          className="h-full w-full"
          style={{
            background: 'linear-gradient(90deg, var(--foreground), var(--glow))',
            willChange: 'transform',
          }}
        />
      </div>

      {chapters.length > 1 && (
        <nav
          aria-label={dict.command.groupNav}
          className="chapter-rail fixed right-4 top-1/2 -translate-y-1/2 z-[60] hidden lg:flex flex-col gap-3"
        >
          {chapters.map(({ id, label }) => {
            const active = id === activeId
            return (
              <button
                key={id}
                type="button"
                onClick={() => jump(id)}
                aria-label={label}
                aria-current={active ? 'true' : undefined}
                data-cursor="view"
                className="group relative flex items-center justify-center w-4 h-4 cursor-pointer"
              >
                <span
                  className={`rounded-full transition-all duration-300 ${
                    active
                      ? 'w-2.5 h-2.5 bg-foreground'
                      : 'w-1.5 h-1.5 bg-foreground/30 group-hover:bg-foreground/60'
                  }`}
                  style={active ? { boxShadow: '0 0 12px -2px var(--glow-soft)' } : undefined}
                />
                <span className="absolute right-6 whitespace-nowrap rounded-md border border-foreground/10 bg-background/90 px-2 py-1 font-sans text-[10px] uppercase tracking-wider text-foreground/70 opacity-0 translate-x-1 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100">
                  {label}
                </span>
              </button>
            )
          })}
        </nav>
      )}
    </>
  )
}
