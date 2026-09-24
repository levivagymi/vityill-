'use client'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ZoomIn, ArrowRight } from 'lucide-react'
import gsap from '@/lib/gsap'
import { fxFull } from '@/lib/fx'
import { useDict } from '@/components/providers/DictProvider'
import SectionHeading from '@/components/ui/SectionHeading'
import { GALLERY_IMAGES } from '@/lib/content'
import { href } from '@/lib/nav'
import type { Locale } from '@/lib/types'
import { useGalleryLightbox, GalleryLightbox } from '@/components/gallery/GalleryLightbox'

export default function Gallery({ limit, withHeading = true }: { limit?: number; withHeading?: boolean }) {
  const dict = useDict()
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const images = limit ? GALLERY_IMAGES.slice(0, limit) : GALLERY_IMAGES
  const lightbox = useGalleryLightbox()
  const sectionRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll-reveal is decoration. In lite mode the elements keep their
    // natural opacity (globals.css only applies .fx-reveal under
    // data-fx="full"), so skipping the timeline shows the content at once
    // instead of leaving it blank behind a tween that never runs.
    if (!fxFull()) return
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
              onClick={() => lightbox.open(images, i)}
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
              className="inline-flex items-center gap-2 border border-foreground/25 hover:border-foreground/55 text-foreground hover:text-foreground font-sans font-semibold text-sm px-6 py-3 rounded-full transition-all cursor-pointer"
              data-cursor="view"
            >
              {dict.common.viewAll} <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>

      <GalleryLightbox lightbox={lightbox} />
    </section>
  )
}
