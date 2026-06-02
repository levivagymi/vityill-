'use client'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { BedDouble, BedSingle, Bath, Sofa, TreePine, DoorOpen } from 'lucide-react'
import gsap, { ScrollTrigger } from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'

const BADGE_ICONS: Record<string, React.ElementType> = {
  'Franciaágy': BedDouble, 'Double Bed': BedDouble, 'Doppelbett': BedDouble,
  'Fürdőszoba': Bath, 'Bathroom': Bath, 'Badezimmer': Bath,
  'Nappali': Sofa, 'Living Area': Sofa, 'Wohnbereich': Sofa,
  'Erdei panoráma': TreePine, 'Forest View': TreePine, 'Waldblick': TreePine,
  '3 egységes ágy': BedSingle, '3 Single Beds': BedSingle, '3 Einzelbetten': BedSingle,
  'Kertkapcsolatos': DoorOpen, 'Garden Access': DoorOpen, 'Gartenzugang': DoorOpen,
}

function RoomCard({
  imageSrc, imageAlt, name, tagline, desc, beds, badges, price, nightLabel, bookLabel, reversed,
}: {
  imageSrc: string; imageAlt: string; name: string; tagline: string; desc: string;
  beds: string; badges: string[]; price: string; nightLabel: string; bookLabel: string; reversed?: boolean
}) {
  return (
    <div
      className="room-card grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-foreground/[0.08] bg-foreground/[0.03]"
      style={{ opacity: 0 }}
    >
      <div className={`relative aspect-[4/3] lg:aspect-auto lg:min-h-[420px] overflow-hidden ${reversed ? 'lg:order-2' : ''}`}>
        <div className="w-full h-full transition-transform duration-700 hover:scale-[1.04]">
          <Image src={imageSrc} alt={imageAlt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
        <div className="absolute top-4 left-4 bg-background/85 backdrop-blur border border-foreground/15 rounded-xl px-4 py-2">
          <div className="flex items-baseline gap-1">
            <span className="text-foreground font-heading text-2xl font-semibold">{price}€</span>
            <span className="text-foreground/45 text-xs font-sans">/{nightLabel}</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
      </div>

      <div className={`flex flex-col p-8 lg:p-10 ${reversed ? 'lg:order-1' : ''}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-foreground/30" />
          <span className="text-foreground/60 text-xs font-sans uppercase tracking-[0.25em]">{name}</span>
        </div>
        <h3 className="font-heading text-2xl sm:text-3xl mb-3 leading-tight">{tagline}</h3>
        <p className="font-sans text-sm leading-relaxed mb-6 flex-1">{desc}</p>
        <div className="flex items-center gap-2 mb-5">
          <BedDouble size={16} className="text-foreground/70" />
          <span className="text-sm font-sans text-foreground/65">{beds}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {badges.map((badge) => {
            const Icon = BADGE_ICONS[badge]
            return (
              <span key={badge} className="flex items-center gap-1.5 text-xs font-sans text-foreground/60 bg-foreground/[0.04] border border-foreground/[0.08] rounded-full px-3 py-1.5">
                {Icon && <Icon size={11} className="text-foreground/55" />}
                {badge}
              </span>
            )
          })}
        </div>
        <button
          onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
          className="w-full border border-foreground/25 hover:border-foreground/60 hover:bg-foreground
                     text-foreground/80 hover:text-background font-sans font-semibold text-sm py-3.5 rounded-xl
                     transition-all duration-300 cursor-pointer"
          data-cursor="view"
        >
          {bookLabel}
        </button>
      </div>
    </div>
  )
}

export default function Rooms() {
  const dict = useDict()
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.rooms-header', { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      })
      gsap.utils.toArray<HTMLElement>('.room-card', sectionRef.current!).forEach((el, i) => {
        gsap.fromTo(el, { opacity: 0, y: 80 }, {
          opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: i * 0.15,
          scrollTrigger: { trigger: el, start: 'top 82%' },
        })
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const room1 = dict.rooms.room1
  const room2 = dict.rooms.room2

  return (
    <section id="rooms" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.04] via-transparent to-foreground/[0.04]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rooms-header text-center mb-16 lg:mb-20" style={{ opacity: 0 }}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10 bg-foreground/30" />
            <span className="text-foreground/60 text-xs font-sans uppercase tracking-[0.3em]">{dict.rooms.label}</span>
            <div className="h-px w-10 bg-foreground/30" />
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl mb-4">{dict.rooms.title}</h2>
          <p className="font-sans text-base max-w-xl mx-auto mb-3">{dict.rooms.subtitle}</p>
          <p className="font-sans text-xs uppercase tracking-widest">{dict.rooms.maxGuests}</p>
        </div>

        <div className="flex flex-col gap-6 lg:gap-8">
          <RoomCard
            imageSrc="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80&fit=crop"
            imageAlt="Upper floor master bedroom"
            name={room1.name} tagline={room1.tagline} desc={room1.desc} beds={room1.beds}
            badges={room1.badges} price={room1.price} nightLabel={dict.rooms.night} bookLabel={dict.rooms.book}
          />
          <RoomCard
            imageSrc="https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80&fit=crop"
            imageAlt="Lower floor three-bed room"
            name={room2.name} tagline={room2.tagline} desc={room2.desc} beds={room2.beds}
            badges={room2.badges} price={room2.price} nightLabel={dict.rooms.night} bookLabel={dict.rooms.book}
            reversed
          />
        </div>
      </div>
    </section>
  )
}
