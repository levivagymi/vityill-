import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Check, BedDouble, Ruler, Users, ArrowRight, ArrowLeft } from 'lucide-react'
import { getDictionary, hasLocale } from '../../dictionaries'
import PageHero from '@/components/ui/PageHero'
import Reveal from '@/components/ui/Reveal'
import BookingCta from '@/components/sections/BookingCta'
import { ROOM_MEDIA } from '@/lib/content'
import { href, roomHref, ROOM_SLUGS, ROOM_KEY_BY_SLUG, type RoomSlug } from '@/lib/nav'

type Props = { params: Promise<{ lang: string; room: string }> }

export function generateStaticParams() {
  const langs = ['hu', 'en', 'de']
  return langs.flatMap((lang) => ROOM_SLUGS.map((room) => ({ lang, room })))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, room } = await params
  if (!hasLocale(lang) || !ROOM_SLUGS.includes(room as RoomSlug)) return {}
  const dict = await getDictionary(lang)
  const r = dict.rooms[ROOM_KEY_BY_SLUG[room as RoomSlug]]
  return { title: `${r.name} — ${r.tagline}`, description: r.desc, alternates: { canonical: `/${lang}/szobak/${room}` } }
}

export default async function RoomDetailPage({ params }: Props) {
  const { lang, room } = await params
  if (!hasLocale(lang) || !ROOM_SLUGS.includes(room as RoomSlug)) notFound()
  const dict = await getDictionary(lang)
  const slug = room as RoomSlug
  const key = ROOM_KEY_BY_SLUG[slug]
  const r = dict.rooms[key]
  const media = ROOM_MEDIA[key]
  const otherKey = key === 'room1' ? 'room2' : 'room1'
  const otherSlug = ROOM_MEDIA[otherKey].slug as RoomSlug

  const specs = [
    { icon: Ruler, label: dict.rooms.sizeLabel, value: r.size },
    { icon: Users, label: dict.rooms.guestsLabel, value: r.guests },
    { icon: BedDouble, label: dict.rooms.bedsLabel, value: r.beds },
  ]

  return (
    <>
      <PageHero
        title={r.tagline}
        subtitle={r.name}
        image={media.hero}
        imageAlt={r.tagline}
        crumbs={[
          { label: dict.common.home, href: `/${lang}` },
          { label: dict.nav.rooms, href: href(lang, 'rooms') },
          { label: r.name },
        ]}
      />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid lg:grid-cols-3 gap-10 lg:gap-14 items-start">
          {/* Content */}
          <div className="lg:col-span-2 space-y-12">
            <Reveal>
              <h2 className="font-heading text-2xl sm:text-3xl mb-4">{dict.rooms.overviewTitle}</h2>
              <p className="font-sans text-foreground/60 leading-[1.85] text-base">{r.long}</p>
            </Reveal>

            <Reveal>
              <h3 className="font-heading text-xl mb-5">{dict.rooms.featuresTitle}</h3>
              <ul className="grid sm:grid-cols-2 gap-3">
                {r.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-3 bg-foreground/[0.03] border border-foreground/[0.07] rounded-xl px-4 py-3">
                    <span className="w-7 h-7 rounded-full bg-foreground/10 border border-foreground/15 flex items-center justify-center shrink-0">
                      <Check size={14} className="text-foreground" />
                    </span>
                    <span className="font-sans text-sm text-foreground/75">{h}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal>
              <h3 className="font-heading text-xl mb-5">{dict.rooms.galleryTitle}</h3>
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                {media.gallery.map((src, i) => (
                  <div key={i} className={`relative overflow-hidden rounded-xl ${i === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-[4/3]'}`}>
                    <Image src={src} alt={`${r.tagline} — ${i + 1}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Sticky booking card */}
          <aside className="lg:sticky lg:top-28">
            <div className="bg-foreground/[0.04] border border-foreground/[0.1] rounded-2xl p-6">
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="font-heading text-4xl font-semibold text-foreground">{r.price}€</span>
                <span className="text-foreground/45 text-sm font-sans">{dict.rooms.perNight}</span>
              </div>
              <p className="text-xs font-sans text-foreground/40 mb-6">{dict.rooms.priceNote}</p>

              <ul className="space-y-3 mb-6">
                {specs.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-center justify-between text-sm font-sans">
                    <span className="flex items-center gap-2 text-foreground/55"><Icon size={15} className="text-foreground/50" /> {label}</span>
                    <span className="text-foreground/85">{value}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={href(lang, 'booking')}
                className="flex items-center justify-center gap-2 w-full bg-foreground hover:bg-foreground/90 text-background font-sans font-semibold text-sm py-3.5 rounded-xl transition-all hover:scale-[1.01] cursor-pointer mb-3"
                data-cursor="view"
              >
                {dict.rooms.bookThis} <ArrowRight size={15} />
              </Link>
              <Link
                href={roomHref(lang, otherSlug)}
                className="flex items-center justify-center gap-2 w-full border border-foreground/20 hover:border-foreground/45 text-foreground/70 hover:text-foreground font-sans text-sm py-3 rounded-xl transition-all cursor-pointer"
                data-cursor="view"
              >
                <ArrowLeft size={14} /> {dict.rooms[otherKey].name}
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <BookingCta />
    </>
  )
}
