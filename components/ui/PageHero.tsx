'use client'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import gsap from '@/lib/gsap'
import { EmblemMark } from '@/components/brand/Logo'

export type Crumb = { label: string; href?: string }

/** Dark, image-backed banner for the top of every subpage. */
export default function PageHero({
  title,
  subtitle,
  image,
  imageAlt,
  crumbs = [],
  emblem = true,
}: {
  title: string
  subtitle?: string
  image: string
  imageAlt: string
  crumbs?: Crumb[]
  emblem?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current!.querySelectorAll('.ph-el'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.15 }
      )
      gsap.fromTo(
        ref.current!.querySelector('.ph-img'),
        { scale: 1.12 },
        { scale: 1, duration: 1.6, ease: 'power2.out' }
      )
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={ref}
      className="relative min-h-[58vh] sm:min-h-[64vh] flex items-end overflow-hidden"
      aria-label={title}
    >
      <div className="ph-img absolute inset-0">
        <Image src={image} alt={imageAlt} fill priority className="object-cover" sizes="100vw" />
      </div>
      <div className="absolute inset-0 bg-[#0a1f14]/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1A4731]/95 via-[#1A4731]/40 to-[#1A4731]/30" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 lg:pb-16 pt-28">
        {emblem && <EmblemMark height={40} tone="light" className="ph-el mb-5" />}

        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="ph-el mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs font-sans text-[rgba(255,244,204,0.6)]">
              {crumbs.map((c, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  {c.href ? (
                    <Link href={c.href} className="hover:text-[#FFF4CC] transition-colors">{c.label}</Link>
                  ) : (
                    <span className="text-[rgba(255,244,204,0.9)]">{c.label}</span>
                  )}
                  {i < crumbs.length - 1 && <ChevronRight size={12} className="text-[rgba(255,244,204,0.35)]" />}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <h1 className="ph-el font-heading text-4xl sm:text-5xl lg:text-6xl text-[#FFF4CC] leading-[1.05] tracking-tight max-w-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="ph-el font-sans text-base sm:text-lg text-[rgba(255,244,204,0.7)] max-w-2xl mt-5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
