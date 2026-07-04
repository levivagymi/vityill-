'use client'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { BedDouble, BedSingle, Bath, Sofa, TreePine, DoorOpen, ArrowRight } from 'lucide-react'
import gsap from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import SectionHeading from '@/components/ui/SectionHeading'
import { ROOM_MEDIA, type RoomKey } from '@/lib/content'
import { href, roomHref } from '@/lib/nav'
import { setPendingFlip } from '@/lib/flip-transition'
import type { Locale } from '@/lib/types'

/** Icons correspond positionally to dict.rooms.<room>.badges — the badge
 *  order is identical across locales, so no per-language mapping is needed. */
const BADGE_ICONS: Record<RoomKey, React.ElementType[]> = {
  room1: [BedDouble, Bath, Sofa, TreePine],
  room2: [BedSingle, Bath, DoorOpen],
}

function RoomCard({
  roomKey, lang, dict, reversed,
}: {
  roomKey: RoomKey; lang: Locale; dict: ReturnType<typeof useDict>; reversed?: boolean
}) {
  const r = dict.rooms[roomKey]
  const media = ROOM_MEDIA[roomKey]
  const detailHref = roomHref(lang, media.slug as 'felso-szint' | 'also-szint')

  return (
    <div className="room-card grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-foreground/[0.08] bg-foreground/[0.03]" style={{ opacity: 0 }}>
      <Link
        href={detailHref}
        data-cursor="view"
        onClick={(e) => setPendingFlip(e.currentTarget, media.hero)}
        className={`relative aspect-[4/3] lg:aspect-auto lg:min-h-[440px] overflow-hidden group ${reversed ? 'lg:order-2' : ''}`}
      >
        <div className="w-full h-full transition-transform duration-700 group-hover:scale-[1.04]">
          <Image src={media.hero} alt={r.tagline} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
        <div className="absolute top-4 left-4 bg-background/85 backdrop-blur border border-foreground/15 rounded-xl px-4 py-2">
          <div className="flex items-baseline gap-1">
            <span className="text-foreground font-heading text-2xl font-semibold">{r.price}€</span>
            <span className="text-foreground/45 text-xs font-sans">{dict.rooms.perNight}</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
      </Link>

      <div className={`flex flex-col p-8 lg:p-10 ${reversed ? 'lg:order-1' : ''}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-foreground/30" />
          <span className="text-foreground/60 text-xs font-sans uppercase tracking-[0.25em]">{r.name}</span>
        </div>
        <h3 className="font-heading text-2xl sm:text-3xl mb-3 leading-tight">{r.tagline}</h3>
        <p className="font-sans text-sm leading-relaxed mb-6 flex-1 text-foreground/55">{r.desc}</p>
        <div className="flex flex-wrap items-center gap-4 mb-5 text-sm font-sans text-foreground/65">
          <span className="flex items-center gap-1.5"><BedDouble size={15} className="text-foreground/55" /> {r.beds}</span>
          <span className="text-foreground/30">·</span>
          <span>{r.size}</span>
          <span className="text-foreground/30">·</span>
          <span>{r.guests}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {r.badges.map((badge, i) => {
            const Icon = BADGE_ICONS[roomKey][i]
            return (
              <span key={badge} className="flex items-center gap-1.5 text-xs font-sans text-foreground/60 bg-foreground/[0.04] border border-foreground/[0.08] rounded-full px-3 py-1.5">
                {Icon && <Icon size={11} className="text-foreground/55" />}
                {badge}
              </span>
            )
          })}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={detailHref}
            className="flex-1 inline-flex items-center justify-center gap-2 border border-foreground/25 hover:border-foreground/60 text-foreground/80 hover:text-foreground font-sans font-semibold text-sm py-3.5 rounded-xl transition-all duration-300 cursor-pointer"
            data-cursor="view"
          >
            {dict.rooms.viewDetails} <ArrowRight size={15} />
          </Link>
          <Link
            href={href(lang, 'booking')}
            className="flex-1 inline-flex items-center justify-center bg-foreground hover:bg-foreground/90 text-background font-sans font-semibold text-sm py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
            data-cursor="view"
          >
            {dict.rooms.book}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Rooms({ withHeading = true }: { withHeading?: boolean }) {
  const dict = useDict()
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
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
          scrollTrigger: { trigger: el, start: 'top 85%' },
        })
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section id="rooms" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.04] via-transparent to-foreground/[0.04]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {withHeading && (
          <div className="rooms-header mb-16 lg:mb-20" style={{ opacity: 0 }}>
            <SectionHeading label={dict.rooms.label} title={dict.rooms.title} subtitle={dict.rooms.subtitle} />
            <p className="font-sans text-xs uppercase tracking-widest text-center text-foreground/40 mt-3">{dict.rooms.maxGuests}</p>
          </div>
        )}

        <div className="flex flex-col gap-6 lg:gap-8">
          <RoomCard roomKey="room1" lang={lang} dict={dict} />
          <RoomCard roomKey="room2" lang={lang} dict={dict} reversed />
        </div>
      </div>
    </section>
  )
}
