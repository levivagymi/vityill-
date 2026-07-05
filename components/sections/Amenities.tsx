'use client'
import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Flame, Waves, Trees, Lightbulb, Mountain, Wind,
  Tv, ChefHat, UtensilsCrossed, ArrowUpRight,
} from 'lucide-react'
import gsap from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import SectionHeading from '@/components/ui/SectionHeading'
import type { AmenityKey } from '@/lib/content'
import { amenityHref, AMENITY_SLUG_BY_KEY } from '@/lib/nav'
import type { Locale } from '@/lib/types'

const AMENITY_ICONS: Record<AmenityKey, React.ElementType> = {
  sauna: Flame, pool: Waves, forest: Trees, lighting: Lightbulb,
  view: Mountain, ac: Wind, tv: Tv, kitchen: ChefHat, grill: UtensilsCrossed,
}

const AMENITY_KEYS: AmenityKey[] = ['sauna', 'pool', 'forest', 'lighting', 'view', 'ac', 'tv', 'kitchen', 'grill']

export default function Amenities() {
  const dict = useDict()
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.amenities-header', { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      })
      gsap.fromTo('.amenity-card', { opacity: 0, y: 50, scale: 0.95 }, {
        opacity: 1, y: 0, scale: 1, stagger: 0.07, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: cardsRef.current, start: 'top 80%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section id="amenities" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.03] via-transparent to-foreground/[0.05]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="amenities-header mb-16 lg:mb-20" style={{ opacity: 0 }}>
          <SectionHeading label={dict.amenities.label} title={dict.amenities.title} subtitle={dict.amenities.subtitle} />
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {AMENITY_KEYS.map((key) => {
            const Icon = AMENITY_ICONS[key]
            return (
              <Link
                key={key}
                href={amenityHref(lang, AMENITY_SLUG_BY_KEY[key])}
                data-cursor="view"
                className="amenity-card group relative block bg-foreground/[0.03] border border-foreground/[0.07] rounded-2xl p-6 lg:p-7
                           hover:border-foreground/15 hover:bg-foreground/[0.06] transition-all duration-300
                           hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/10 cursor-pointer"
                style={{ opacity: 0 }}
              >
                <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] border border-foreground/10 flex items-center justify-center mb-5
                                group-hover:bg-foreground/[0.12] group-hover:border-foreground/20 transition-all duration-300">
                  <Icon size={22} className="text-foreground" />
                </div>
                <h3 className="font-heading text-lg mb-2">{dict.amenities[key].name}</h3>
                <p className="font-sans text-sm text-foreground/60 leading-relaxed">{dict.amenities[key].desc}</p>
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-foreground/10 border border-foreground/15
                                flex items-center justify-center opacity-0 translate-x-1 -translate-y-1
                                group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300">
                  <ArrowUpRight size={14} className="text-foreground" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
