import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BedDouble } from 'lucide-react'
import { getDictionary, hasLocale } from '../dictionaries'
import ExperiencesScroll from '@/components/sections/ExperiencesScroll'
import Amenities from '@/components/sections/Amenities'
import BookingCta from '@/components/sections/BookingCta'
import { ROOM_MEDIA } from '@/lib/content'
import { href, roomHref } from '@/lib/nav'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return { title: dict.rooms.title, description: dict.rooms.subtitle, alternates: { canonical: `/${lang}/szobak` } }
}

export default async function RoomsPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  const items = [
    {
      slug: 'felso-szint',
      eyebrow: dict.rooms.room1.name,
      title: dict.rooms.room1.tagline,
      detail: dict.rooms.room1.desc,
      image: ROOM_MEDIA.room1.hero,
      icon: <BedDouble size={22} className="text-foreground" />,
      exploreHref: roomHref(lang, 'felso-szint'),
    },
    {
      slug: 'also-szint',
      eyebrow: dict.rooms.room2.name,
      title: dict.rooms.room2.tagline,
      detail: dict.rooms.room2.desc,
      image: ROOM_MEDIA.room2.hero,
      icon: <BedDouble size={22} className="text-foreground" />,
      exploreHref: roomHref(lang, 'also-szint'),
    },
  ]

  return (
    <>
      <ExperiencesScroll
        heroTitle={dict.rooms.title}
        heroSubtitle={dict.rooms.heroSubtitle}
        heroImage={ROOM_MEDIA.room1.hero}
        heroImageAlt={dict.rooms.title}
        heroCrumbs={[{ label: dict.common.home, href: `/${lang}` }, { label: dict.nav.rooms }]}
        intro={dict.rooms.wholeHouseNote}
        items={items}
        exploreLabel={dict.rooms.viewDetails}
        bookNowLabel={dict.nav.bookNow}
        bookHref={href(lang, 'booking')}
      />

      <Amenities />
      <BookingCta />
    </>
  )
}
