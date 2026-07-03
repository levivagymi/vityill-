'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { X, ChevronLeft, ChevronRight, ZoomIn, ArrowRight } from 'lucide-react'
import gsap from '@/lib/gsap'
import { ScrollTrigger } from '@/lib/gsap'
import { useLenis } from '@/components/engine/LenisProvider'
import { useDict } from '@/components/providers/DictProvider'
import SectionHeading from '@/components/ui/SectionHeading'
import { GALLERY_IMAGES } from '@/lib/content'
import { href } from '@/lib/nav'
import type { Locale } from '@/lib/types'

export default function Gallery({ limit, withHeading = true }: { limit?: number; withHeading?: boolean }) {
  const dict = useDict()
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const images = limit ? GALLERY_IMAGES.slice(0, limit) : GALLERY_IMAGES
  const lenis = useLenis()
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [lightboxVisible, setLightboxVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const lightboxImgRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const openLightbox = useCallback((i: number) => { setLightboxIdx(i); setLightboxVisible(true) }, [])
  const closeLightbox = useCallback(() => { setLightboxVisible(false); setTimeout(() => setLightboxIdx(null), 200) }, [])
  const prevImage = useCallback(() => setLightboxIdx((i) => (i !== null ? (i - 1 + images.length) % images.length : null)), [images.length])
  const nextImage = useCallback(() => setLightboxIdx((i) => (i !== null ? (i + 1) % images.length : null)), [images.length])

  useEffect(() => {
    void ScrollTrigger
    const ctx = gsap.context(() => {
      gsap.fromTo('.gallery-header', { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      })
      gsap.fromTo('.gallery-item', { opacity: 0, scale: 0.9 }, {
        opacity: 1, scale: 1, stagger: 0.06, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: gridRef.current, start: 'top 82%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (lightboxIdx !== null && lightboxImgRef.current) {
      gsap.fromTo(lightboxImgRef.current, { scale: 0.88, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' })
    }
  }, [lightboxIdx])

  // Lock page scroll and move focus into the dialog while the lightbox is open
  useEffect(() => {
    if (lightboxIdx === null) return
    lenis?.stop()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      lenis?.start()
    }
    // Only the open/closed transition matters here, not every index change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIdx === null])

  useEffect(() => {
    if (lightboxIdx === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImage()
      else if (e.key === 'ArrowRight') nextImage()
      else if (e.key === 'Escape') closeLightbox()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIdx, prevImage, nextImage, closeLightbox])

  return (
    <section id="gallery" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {withHeading && (
          <div className="gallery-header mb-14 lg:mb-16">
            <SectionHeading label={dict.gallery.label} title={dict.gallery.title} subtitle={dict.gallery.subtitle} />
          </div>
        )}

        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 auto-rows-[200px]">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => openLightbox(i)}
              data-cursor="view"
              aria-label={img.alt}
              className={`gallery-item relative overflow-hidden rounded-xl cursor-pointer group bg-foreground/[0.05] ${
                img.aspect === 'portrait' ? 'row-span-2 aspect-[3/4]' : 'aspect-[4/3]'
              }`}
            >
              <div className="w-full h-full transition-transform duration-500 group-hover:scale-[1.06]">
                <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
              </div>
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/50 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-12 h-12 rounded-full bg-foreground/85 flex items-center justify-center shadow-lg">
                    <ZoomIn size={20} className="text-background" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {limit && (
          <div className="text-center mt-10">
            <Link
              href={href(lang, 'gallery')}
              className="inline-flex items-center gap-2 border border-foreground/25 hover:border-foreground/55 text-foreground/80 hover:text-foreground font-sans font-semibold text-sm px-6 py-3 rounded-full transition-all cursor-pointer"
              data-cursor="view"
            >
              {dict.common.viewAll} <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>

      {lightboxIdx !== null && (
        <div
          className={`fixed inset-0 z-[70] bg-black/96 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${lightboxVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={images[lightboxIdx].alt}
        >
          <div ref={lightboxImgRef} onClick={(e) => e.stopPropagation()} className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image src={images[lightboxIdx].src.replace(/w=\d+/, 'w=1600')} alt={images[lightboxIdx].alt} fill className="object-contain" sizes="90vw" />
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <span className="text-sm font-sans text-white/50">{lightboxIdx + 1} {dict.gallery.of} {images.length}</span>
          </div>

          <button ref={closeBtnRef} onClick={closeLightbox} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer" aria-label={dict.gallery.close}>
            <X size={18} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prevImage() }} className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer" aria-label={dict.gallery.prev}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); nextImage() }} className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer" aria-label={dict.gallery.next}>
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </section>
  )
}
