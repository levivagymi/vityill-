'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import gsap from '@/lib/gsap'
import { ScrollTrigger } from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'

const GALLERY_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80&fit=crop', alt: 'Forest at dawn', aspect: 'landscape' },
  { src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&q=80&fit=crop', alt: 'Cabin exterior', aspect: 'portrait' },
  { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80&fit=crop', alt: 'Sauna interior', aspect: 'portrait' },
  { src: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80&fit=crop', alt: 'Outdoor pool', aspect: 'landscape' },
  { src: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80&fit=crop', alt: 'Master bedroom', aspect: 'portrait' },
  { src: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80&fit=crop', alt: 'Modern kitchen', aspect: 'landscape' },
  { src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=80&fit=crop', alt: 'Forest path', aspect: 'landscape' },
  { src: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80&fit=crop', alt: 'Bathroom interior', aspect: 'portrait' },
  { src: 'https://images.unsplash.com/photo-1504204267155-aaad8e81290d?w=800&q=80&fit=crop', alt: 'Outdoor fire grill', aspect: 'landscape' },
  { src: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&fit=crop', alt: 'Aerial forest view', aspect: 'landscape' },
  { src: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=80&fit=crop', alt: 'Cozy bedroom', aspect: 'portrait' },
  { src: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80&fit=crop', alt: 'Misty forest morning', aspect: 'landscape' },
]

export default function Gallery() {
  const dict = useDict()
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [lightboxVisible, setLightboxVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const lightboxImgRef = useRef<HTMLDivElement>(null)

  const openLightbox = useCallback((i: number) => {
    setLightboxIdx(i)
    setLightboxVisible(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxVisible(false)
    setTimeout(() => setLightboxIdx(null), 200)
  }, [])

  const prevImage = useCallback(() => {
    setLightboxIdx((i) => (i !== null ? (i - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length : null))
  }, [])

  const nextImage = useCallback(() => {
    setLightboxIdx((i) => (i !== null ? (i + 1) % GALLERY_IMAGES.length : null))
  }, [])

  useEffect(() => {
    void ScrollTrigger
    const ctx = gsap.context(() => {
      gsap.fromTo('.gallery-header', { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      })
      gsap.fromTo('.gallery-item', { opacity: 0, scale: 0.9 }, {
        opacity: 1, scale: 1, stagger: 0.06, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: gridRef.current, start: 'top 80%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (lightboxIdx !== null && lightboxImgRef.current) {
      gsap.fromTo(lightboxImgRef.current,
        { scale: 0.88, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' }
      )
    }
  }, [lightboxIdx])

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
        <div className="gallery-header text-center mb-14 lg:mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10 bg-foreground/55" />
            <span className="text-foreground/55 text-xs font-sans uppercase tracking-[0.3em]">{dict.gallery.label}</span>
            <div className="h-px w-10 bg-foreground/55" />
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl mb-4">{dict.gallery.title}</h2>
          <p className="font-sans text-base max-w-xl mx-auto">{dict.gallery.subtitle}</p>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 auto-rows-[200px]"
        >
          {GALLERY_IMAGES.map((img, i) => (
            <div
              key={i}
              onClick={() => openLightbox(i)}
              data-cursor="view"
              className={`gallery-item relative overflow-hidden rounded-xl cursor-pointer group ${
                img.aspect === 'portrait' ? 'row-span-2 aspect-[3/4]' : 'aspect-[4/3]'
              }`}
            >
              <div className="w-full h-full transition-transform duration-500 group-hover:scale-[1.06]">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/50 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-12 h-12 rounded-full bg-foreground/85 flex items-center justify-center shadow-lg">
                    <ZoomIn size={20} className="text-background" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightboxIdx !== null && (
        <div
          className={`fixed inset-0 z-50 bg-black/96 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${
            lightboxVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeLightbox}
        >
          <div
            ref={lightboxImgRef}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center"
          >
            <div className="relative w-full h-full">
              <Image
                src={GALLERY_IMAGES[lightboxIdx].src.replace(/w=\d+/, 'w=1600')}
                alt={GALLERY_IMAGES[lightboxIdx].alt}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <span className="text-sm font-sans text-white/50">
              {lightboxIdx + 1} {dict.gallery.of} {GALLERY_IMAGES.length}
            </span>
          </div>

          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
            aria-label={dict.gallery.close}
          >
            <X size={18} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); prevImage() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
            aria-label={dict.gallery.prev}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); nextImage() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
            aria-label={dict.gallery.next}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </section>
  )
}
