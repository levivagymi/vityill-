'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ZoomIn, LayoutGrid, Rows3 } from 'lucide-react'
import gsap, { ScrollTrigger } from '@/lib/gsap'
import { fxFull } from '@/lib/fx'
import { useLenis, scrollToAnchor } from '@/components/engine/LenisProvider'
import { useDict } from '@/components/providers/DictProvider'
import SectionHeading from '@/components/ui/SectionHeading'
import { GALLERY_IMAGES, type GalleryCategory } from '@/lib/content'
import { useGalleryLightbox, GalleryLightbox } from '@/components/gallery/GalleryLightbox'

type ViewMode = 'tabs' | 'sections'
type FilterKey = 'all' | GalleryCategory
const CATEGORIES: GalleryCategory[] = ['kulter', 'belter', 'wellness']

/** Full /galeria page experience: a view-mode toggle switches between a
 *  sticky tab-filtered uniform grid and a scrollable per-category section
 *  layout, both sharing one lightbox instance. The homepage teaser
 *  (components/sections/Gallery.tsx) is untouched by any of this. */
export default function GalleryExplorer() {
  const dict = useDict()
  const lenis = useLenis()
  const lightbox = useGalleryLightbox()
  const [viewMode, setViewMode] = useState<ViewMode>('tabs')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [activeAnchor, setActiveAnchor] = useState<GalleryCategory | ''>('')
  const gridRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const isFirstFilterRender = useRef(true)

  const label = (k: FilterKey) => dict.gallery.categories[k]

  const filteredImages = useMemo(
    () => (activeFilter === 'all' ? GALLERY_IMAGES : GALLERY_IMAGES.filter((img) => img.category === activeFilter)),
    [activeFilter]
  )

  // Fade+scale the OLD tiles out, swap the filter in onComplete (which
  // changes what .filter() above returns, i.e. what's actually rendered),
  // then a effect below fades the NEW tiles in. In lite mode just swap
  // instantly, same degrade pattern every other effect in this codebase uses.
  const changeFilter = (next: FilterKey) => {
    if (next === activeFilter) return
    if (!fxFull() || !gridRef.current) { setActiveFilter(next); return }
    const tiles = gridRef.current.querySelectorAll('.gallery-item')
    gsap.to(tiles, { opacity: 0, scale: 0.92, duration: 0.22, ease: 'power2.in', stagger: 0.015 })
    // setTimeout, not the tween's onComplete: GSAP's ticker is rAF-driven and
    // fully pauses in a backgrounded tab, which would leave onComplete (and
    // thus the filter swap) stuck until the tab regains focus. setTimeout
    // still fires — same reasoning as GalleryLightbox's close()'s setTimeout
    // rather than an onComplete for its own fade-out.
    setTimeout(() => setActiveFilter(next), 220 + Math.max(0, tiles.length - 1) * 15)
  }

  useEffect(() => {
    // Skip on mount — the mount-time ScrollTrigger reveal below already owns
    // first paint; this effect only owns the *subsequent* filter-change
    // entrance.
    if (isFirstFilterRender.current) { isFirstFilterRender.current = false; return }
    if (viewMode !== 'tabs' || !fxFull() || !gridRef.current) return
    const tiles = gridRef.current.querySelectorAll('.gallery-item')
    gsap.fromTo(tiles, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out', stagger: 0.035 })
  }, [activeFilter, viewMode])

  // First-paint reveal for whichever view is active on mount (or after
  // switching between tabs/sections, since that swaps the whole DOM tree).
  useEffect(() => {
    if (!fxFull()) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.gallery-item', { opacity: 0, scale: 0.9 }, {
        opacity: 1, scale: 1, stagger: 0.05, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: gridRef.current ?? undefined, start: 'top 85%' },
      })
    })
    return () => ctx.revert()
  }, [viewMode])

  // Section-view "currently reading" spy, same ScrollTrigger onToggle pattern
  // as ScrollProgress.tsx's homepage chapter rail.
  useEffect(() => {
    if (viewMode !== 'sections' || !fxFull()) return
    const spies = CATEGORIES.filter((cat) => document.getElementById(cat)).map((cat) =>
      ScrollTrigger.create({
        trigger: `#${cat}`,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => { if (self.isActive) setActiveAnchor(cat) },
      })
    )
    return () => spies.forEach((s) => s.kill())
  }, [viewMode])

  const jumpTo = (cat: GalleryCategory) => {
    // Measured, not hardcoded: the bar wraps to two rows on narrow phones
    // (toggle + pills stack), so its real height varies by breakpoint.
    const barHeight = barRef.current?.offsetHeight ?? 64
    scrollToAnchor(lenis, `#${cat}`, -(barHeight + 12))
  }

  const pillClass = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-xs font-sans font-semibold border transition-all cursor-pointer ${
      active ? 'bg-foreground text-background border-foreground' : 'text-muted-foreground hover:text-foreground border-foreground/15'
    }`

  return (
    <div>
      <div ref={barRef} className="sticky top-16 lg:top-20 z-20 bg-background/95 backdrop-blur-md border-b border-foreground/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
          <div role="group" aria-label={dict.gallery.viewModeLabel} className="inline-flex items-center gap-1 rounded-full border border-foreground/15 p-1 shrink-0">
            <button
              type="button"
              aria-pressed={viewMode === 'tabs'}
              onClick={() => setViewMode('tabs')}
              data-cursor="view"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-semibold transition-all cursor-pointer ${viewMode === 'tabs' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid size={14} /> {dict.gallery.viewTabs}
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'sections'}
              onClick={() => setViewMode('sections')}
              data-cursor="view"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-semibold transition-all cursor-pointer ${viewMode === 'sections' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Rows3 size={14} /> {dict.gallery.viewSections}
            </button>
          </div>

          <div role="group" aria-label={dict.gallery.label} className="flex items-center gap-2 flex-wrap justify-center">
            {viewMode === 'tabs' ? (
              <>
                <button type="button" aria-pressed={activeFilter === 'all'} onClick={() => changeFilter('all')} data-cursor="view" className={pillClass(activeFilter === 'all')}>
                  {label('all')}
                </button>
                {CATEGORIES.map((cat) => (
                  <button key={cat} type="button" aria-pressed={activeFilter === cat} onClick={() => changeFilter(cat)} data-cursor="view" className={pillClass(activeFilter === cat)}>
                    {label(cat)}
                  </button>
                ))}
              </>
            ) : (
              CATEGORIES.map((cat) => (
                <button key={cat} type="button" aria-current={activeAnchor === cat ? 'true' : undefined} onClick={() => jumpTo(cat)} data-cursor="view" className={pillClass(activeAnchor === cat)}>
                  {label(cat)}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {viewMode === 'tabs' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {filteredImages.map((img, i) => (
              <GalleryTile key={img.src} img={img} categoryLabel={label(img.category)} onClick={() => lightbox.open(filteredImages, i)} />
            ))}
          </div>
        </div>
      ) : (
        CATEGORIES.map((cat) => {
          const catImages = GALLERY_IMAGES.filter((img) => img.category === cat)
          if (catImages.length === 0) return null
          return (
            <section
              key={cat}
              id={cat}
              // Inline style, not a Tailwind scroll-mt-* utility: globals.css's
              // sitewide `[id] { scroll-margin-top: 80px }` is unlayered CSS,
              // and unlayered rules always beat Tailwind's @layer-utilities
              // output regardless of specificity — a scroll-mt-[...] class here
              // would silently lose to that rule.
              style={{ scrollMarginTop: 190 }}
              className="py-12 lg:py-16"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionHeading title={label(cat)} center={false} emblem={false} className="mb-8" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                  {catImages.map((img, i) => (
                    <GalleryTile key={img.src} img={img} categoryLabel={label(cat)} onClick={() => lightbox.open(catImages, i)} />
                  ))}
                </div>
              </div>
            </section>
          )
        })
      )}

      <GalleryLightbox lightbox={lightbox} />
    </div>
  )
}

function GalleryTile({ img, categoryLabel, onClick }: { img: { src: string; alt: string }; categoryLabel: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-cursor="view"
      aria-label={img.alt}
      className="gallery-item relative overflow-hidden rounded-xl cursor-pointer group bg-foreground/[0.05] aspect-[4/3]"
    >
      <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
        <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
      </div>
      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/50 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-foreground/85 flex items-center justify-center shadow-lg">
            <ZoomIn size={20} className="text-background" />
          </div>
        </div>
      </div>
      <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-[#0a1f14]/75 backdrop-blur-sm text-on-dark-strong text-[11px] font-sans uppercase tracking-wider opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        {categoryLabel}
      </span>
    </button>
  )
}
