'use client'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import gsap from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import { EmblemMark } from '@/components/brand/Logo'
import { href } from '@/lib/nav'
import { HERO_BANNER } from '@/lib/content'
import type { Locale } from '@/lib/types'

export default function BookingCta() {
  const dict = useDict()
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current!.querySelectorAll('.cta-el'),
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: ref.current, start: 'top 82%' } }
      )
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={ref} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-foreground/10">
          <Image src={HERO_BANNER} alt="" fill className="object-cover" sizes="100vw" aria-hidden />
          <div className="absolute inset-0 bg-[#0a1f14]/82" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A4731]/70 to-transparent" />

          <div className="relative z-10 px-6 sm:px-10 lg:px-16 py-16 lg:py-24 text-center flex flex-col items-center">
            <EmblemMark height={46} tone="light" className="cta-el mb-6" />
            <span className="cta-el text-[rgba(255,244,204,0.6)] text-xs font-sans uppercase tracking-[0.3em] mb-4">
              {dict.bookingCta.label}
            </span>
            <h2 className="cta-el font-heading text-3xl sm:text-4xl lg:text-5xl text-[#FFF4CC] leading-tight max-w-2xl mb-5">
              {dict.bookingCta.title}
            </h2>
            <p className="cta-el font-sans text-base text-[rgba(255,244,204,0.7)] max-w-xl leading-relaxed mb-9">
              {dict.bookingCta.text}
            </p>
            <div className="cta-el flex flex-col sm:flex-row gap-3">
              <Link
                href={href(lang, 'booking')}
                className="inline-flex items-center justify-center gap-2 bg-[#FFF4CC] hover:bg-[rgba(255,244,204,0.9)] text-[#1A4731] font-sans font-semibold text-sm px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 cursor-pointer"
                data-cursor="view"
              >
                {dict.bookingCta.button} <ArrowRight size={16} />
              </Link>
              <Link
                href={href(lang, 'contact')}
                className="inline-flex items-center justify-center border border-[rgba(255,244,204,0.3)] hover:border-[rgba(255,244,204,0.6)] text-[#FFF4CC] font-sans font-semibold text-sm px-8 py-4 rounded-full transition-all duration-300 cursor-pointer"
                data-cursor="view"
              >
                {dict.bookingCta.secondary}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
