'use client'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Ruler, Users, BedDouble, ArrowRight } from 'lucide-react'
import gsap from '@/lib/gsap'
import { fxFull } from '@/lib/fx'
import { useDict } from '@/components/providers/DictProvider'
import SectionHeading from '@/components/ui/SectionHeading'
import { ROOM_MEDIA, type RoomKey } from '@/lib/content'
import { href, roomHref, type RoomSlug } from '@/lib/nav'
import { setPendingFlip } from '@/lib/flip-transition'
import { fromRatePerPerson, formatHUF } from '@/lib/booking'
import type { Locale } from '@/lib/types'

/** The house is always booked as a single unit (never per floor) — one card,
 *  one price, one booking CTA. The floor links below just jump to photos. */
function HouseCard({ lang, dict }: { lang: Locale; dict: ReturnType<typeof useDict> }) {
  const price = fromRatePerPerson()
  const upperHref = roomHref(lang, 'felso-szint')
  const lowerHref = roomHref(lang, 'also-szint')

  return (
    <div className="room-card fx-reveal grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-foreground/[0.08] bg-card">
      <Link
        href={upperHref}
        data-cursor="view"
        onClick={(e) => setPendingFlip(e.currentTarget, ROOM_MEDIA.room1.hero)}
        className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[440px] overflow-hidden group"
      >
        <div className="w-full h-full transition-transform duration-700 group-hover:scale-[1.04]">
          <Image src={ROOM_MEDIA.room1.hero} alt={dict.rooms.houseTagline} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
        <div className="absolute top-4 left-4 bg-background/85 backdrop-blur border border-foreground/15 rounded-xl px-4 py-2">
          <div className="flex items-baseline gap-1">
            <span className="text-foreground font-heading text-2xl font-semibold">{formatHUF(price, lang)}</span>
            <span className="text-muted-foreground text-xs font-sans">{dict.rooms.perPersonPerNight}</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
      </Link>

      <div className="flex flex-col p-8 lg:p-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-foreground/30" />
          <span className="text-muted-foreground text-xs font-sans uppercase tracking-[0.25em]">{dict.rooms.houseName}</span>
        </div>
        <h3 className="font-heading text-2xl sm:text-3xl mb-3 leading-tight">{dict.rooms.houseTagline}</h3>
        <p className="font-sans text-sm leading-relaxed mb-4 text-muted-foreground">{dict.rooms.houseDesc}</p>
        <p className="text-xs font-sans text-muted-foreground leading-relaxed flex items-start gap-2 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 mt-1.5 shrink-0" />
          {dict.rooms.upperFloorNote}
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-8 text-sm font-sans">
          <Link
            href={upperHref}
            onClick={(e) => setPendingFlip(e.currentTarget, ROOM_MEDIA.room1.hero)}
            className="text-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            data-cursor="view"
          >
            {dict.rooms.room1.name}
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link
            href={lowerHref}
            onClick={(e) => setPendingFlip(e.currentTarget, ROOM_MEDIA.room2.hero)}
            className="text-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            data-cursor="view"
          >
            {dict.rooms.room2.name}
          </Link>
        </div>
        <Link
          href={href(lang, 'booking')}
          className="inline-flex items-center justify-center bg-foreground hover:bg-foreground/90 text-background font-sans font-semibold text-sm py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
          data-cursor="view"
        >
          {dict.rooms.book}
        </Link>
      </div>
    </div>
  )
}

/** A single room's own preview card — links through to its full detail page
 *  (specs + amenities + gallery), which the house-level HouseCard above only
 *  links to via plain text. Gives each room its own visual presence on the
 *  listing page instead of leaving it a footnote inside one combined card. */
function RoomPreviewCard({
  lang,
  dict,
  roomKey,
  slug,
}: {
  lang: Locale
  dict: ReturnType<typeof useDict>
  roomKey: RoomKey
  slug: RoomSlug
}) {
  const r = dict.rooms[roomKey]
  const media = ROOM_MEDIA[roomKey]
  const roomLink = roomHref(lang, slug)
  const specs = [
    { icon: Ruler, value: r.size },
    { icon: Users, value: r.guests },
    { icon: BedDouble, value: r.beds },
  ]

  return (
    <Link
      href={roomLink}
      data-cursor="view"
      onClick={(e) => setPendingFlip(e.currentTarget, media.hero)}
      className="room-card fx-reveal group flex flex-col rounded-2xl overflow-hidden border border-foreground/[0.08] bg-card hover:border-foreground/20 transition-colors duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="w-full h-full transition-transform duration-700 group-hover:scale-[1.04]">
          <Image src={media.hero} alt={r.tagline} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
      </div>

      <div className="flex flex-col flex-1 p-6 lg:p-7">
        <span className="text-muted-foreground text-xs font-sans uppercase tracking-[0.25em] mb-2">{r.name}</span>
        <h4 className="font-heading text-xl mb-2 leading-tight">{r.tagline}</h4>
        <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-5">{r.desc}</p>

        <div className="flex flex-wrap gap-2 mb-5">
          {r.badges.map((b) => (
            <span key={b} className="text-xs font-sans text-foreground bg-foreground/[0.04] border border-foreground/10 rounded-full px-3 py-1">
              {b}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-auto pt-4 border-t border-foreground/[0.07] text-xs font-sans text-muted-foreground">
          {specs.map(({ icon: Icon, value }, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <Icon size={13} /> {value}
            </span>
          ))}
        </div>

        <span className="inline-flex items-center gap-1.5 text-sm font-sans text-foreground mt-5 group-hover:gap-2.5 transition-all duration-300">
          {dict.rooms.viewDetails} <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  )
}

export default function Rooms({ withHeading = true }: { withHeading?: boolean }) {
  const dict = useDict()
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
      // Scroll-reveal is decoration. In lite mode the elements keep their
      // natural opacity (globals.css only applies .fx-reveal under
      // data-fx="full"), so skipping the timeline shows the content at once
      // instead of leaving it blank behind a tween that never runs.
      if (!fxFull()) return
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
          <div className="rooms-header fx-reveal mb-16 lg:mb-20">
            <SectionHeading label={dict.rooms.label} title={dict.rooms.title} subtitle={dict.rooms.subtitle} />
            <p className="font-sans text-xs uppercase tracking-widest text-center text-muted-foreground mt-3">{dict.rooms.maxGuests}</p>
          </div>
        )}

        <div className="flex flex-col gap-6 lg:gap-8">
          <HouseCard lang={lang} dict={dict} />

          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            <RoomPreviewCard lang={lang} dict={dict} roomKey="room1" slug="felso-szint" />
            <RoomPreviewCard lang={lang} dict={dict} roomKey="room2" slug="also-szint" />
          </div>
        </div>
      </div>
    </section>
  )
}
