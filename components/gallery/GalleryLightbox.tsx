'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import gsap from '@/lib/gsap'
import { useLenis } from '@/components/engine/LenisProvider'
import { useDict } from '@/components/providers/DictProvider'

export type LightboxImage = { src: string; alt: string }

/** Shared lightbox state, used by the homepage teaser, the tab-filtered
 *  grid, and each section-view grid alike. `open()` takes the image SET at
 *  call time (not one fixed when the hook is created), so prev/next always
 *  cycles within whichever subset the visitor actually clicked into. */
export function useGalleryLightbox() {
  const lenis = useLenis()
  const [images, setImages] = useState<LightboxImage[]>([])
  const [index, setIndex] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const open = useCallback((imgs: LightboxImage[], i: number) => {
    setImages(imgs)
    setIndex(i)
    setVisible(true)
  }, [])
  const close = useCallback(() => {
    setVisible(false)
    setTimeout(() => setIndex(null), 200)
  }, [])
  const prev = useCallback(
    () => setIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null)),
    [images.length]
  )
  const next = useCallback(
    () => setIndex((i) => (i !== null ? (i + 1) % images.length : null)),
    [images.length]
  )

  useEffect(() => {
    if (index !== null && imgRef.current) {
      gsap.fromTo(imgRef.current, { scale: 0.88, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' })
    }
  }, [index])

  // Lock page scroll and move focus into the dialog while the lightbox is open
  useEffect(() => {
    if (index === null) return
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
  }, [index === null])

  useEffect(() => {
    if (index === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [index, prev, next, close])

  return { images, index, visible, imgRef, closeBtnRef, open, close, prev, next }
}

export function GalleryLightbox({ lightbox }: { lightbox: ReturnType<typeof useGalleryLightbox> }) {
  const dict = useDict()
  const { images, index, visible, imgRef, closeBtnRef, close, prev, next } = lightbox
  if (index === null) return null
  const img = images[index]

  return (
    <div
      className={`fixed inset-0 z-[70] bg-[#0a1f14]/96 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={img.alt}
    >
      <div ref={imgRef} onClick={(e) => e.stopPropagation()} className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center">
        <div className="relative w-full h-full">
          <Image src={img.src} alt={img.alt} fill className="object-contain" sizes="90vw" />
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <span className="text-sm font-sans text-on-dark-muted">{index + 1} {dict.gallery.of} {images.length}</span>
      </div>

      <button ref={closeBtnRef} onClick={close} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 flex items-center justify-center text-on-dark-muted hover:text-on-dark-strong transition-all cursor-pointer" aria-label={dict.gallery.close}>
        <X size={18} />
      </button>
      <button onClick={(e) => { e.stopPropagation(); prev() }} className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 flex items-center justify-center text-on-dark-muted hover:text-on-dark-strong transition-all cursor-pointer" aria-label={dict.gallery.prev}>
        <ChevronLeft size={20} />
      </button>
      <button onClick={(e) => { e.stopPropagation(); next() }} className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 flex items-center justify-center text-on-dark-muted hover:text-on-dark-strong transition-all cursor-pointer" aria-label={dict.gallery.next}>
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
