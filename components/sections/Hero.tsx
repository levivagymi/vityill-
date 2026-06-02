'use client'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import gsap, { ScrollTrigger } from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'

export default function Hero() {
  const dict = useDict()
  const sectionRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const image = imageRef.current
    const overlay = overlayRef.current
    const content = contentRef.current
    if (!section || !image || !overlay || !content) return

    const ctx = gsap.context(() => {
      gsap.to(image, {
        yPercent: 40,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })

      gsap.fromTo(overlay, { opacity: 0.5 }, {
        opacity: 0.82,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
      })

      gsap.fromTo(
        content.querySelectorAll('.hero-el'),
        { opacity: 0, y: 45 },
        { opacity: 1, y: 0, stagger: 0.14, duration: 1.0, ease: 'power3.out', delay: 0.25 }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative h-screen min-h-[600px] max-h-[1080px] overflow-hidden"
      aria-label="Hero"
    >
      <div
        ref={imageRef}
        className="absolute inset-0 w-full h-[130%] -top-[15%]"
        style={{ willChange: 'transform' }}
      >
        <Image
          src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80&fit=crop"
          alt="Gerecse forest at dawn"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <div ref={overlayRef} className="absolute inset-0 bg-[#0a1f14]" style={{ opacity: 0.5 }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A4731]/30 via-transparent to-[#1A4731]/70" />

      <div
        ref={contentRef}
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4"
      >
        <div className="hero-el flex items-center gap-3 mb-6" style={{ opacity: 0 }}>
          <div className="h-px w-12 bg-[rgba(255,244,204,0.35)]" />
          <span className="text-[rgba(255,244,204,0.7)] text-xs sm:text-sm font-sans uppercase tracking-[0.35em]">
            {dict.hero.eyebrow}
          </span>
          <div className="h-px w-12 bg-[rgba(255,244,204,0.35)]" />
        </div>

        <h1
          className="hero-el font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-[#FFF4CC] leading-none tracking-tight mb-3"
          style={{ opacity: 0 }}
        >
          Vityilló
        </h1>
        <p
          className="hero-el font-heading text-xl sm:text-2xl md:text-3xl text-[rgba(255,244,204,0.75)] font-normal italic mb-5 tracking-wide"
          style={{ opacity: 0 }}
        >
          Vendégház
        </p>

        <p
          className="hero-el font-sans text-sm sm:text-base md:text-lg text-[rgba(255,244,204,0.6)] max-w-md mx-auto leading-relaxed mb-2"
          style={{ opacity: 0 }}
        >
          {dict.hero.tagline}
        </p>
        <p
          className="hero-el font-sans text-xs sm:text-sm text-[rgba(255,244,204,0.4)] max-w-sm mx-auto leading-relaxed mb-10"
          style={{ opacity: 0 }}
        >
          {dict.hero.subtitle}
        </p>

        <button
          className="hero-el bg-[#FFF4CC] hover:bg-[rgba(255,244,204,0.9)] text-[#1A4731] font-sans font-semibold text-sm sm:text-base px-8 sm:px-10 py-3.5 sm:py-4 rounded-full transition-all duration-300 hover:shadow-2xl hover:shadow-[rgba(255,244,204,0.15)] hover:scale-105"
          onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
          style={{ opacity: 0 }}
          data-cursor="view"
        >
          <span className="tracking-wide">{dict.hero.cta}</span>
        </button>
      </div>

      <button
        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 group"
        aria-label="Scroll down"
      >
        <span className="text-[rgba(255,244,204,0.35)] text-[10px] font-sans uppercase tracking-[0.3em]">
          {dict.hero.scroll}
        </span>
        <ChevronDown
          size={20}
          className="text-[rgba(255,244,204,0.45)] group-hover:text-[rgba(255,244,204,0.8)] transition-colors animate-bounce"
        />
      </button>
    </section>
  )
}
