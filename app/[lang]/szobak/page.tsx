import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'
import PageHero from '@/components/ui/PageHero'
import Rooms from '@/components/sections/Rooms'
import Amenities from '@/components/sections/Amenities'
import BookingCta from '@/components/sections/BookingCta'
import { ROOM_MEDIA } from '@/lib/content'

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

  return (
    <>
      <PageHero
        title={dict.rooms.title}
        subtitle={dict.rooms.heroSubtitle}
        image={ROOM_MEDIA.room1.hero}
        imageAlt={dict.rooms.title}
        crumbs={[{ label: dict.common.home, href: `/${lang}` }, { label: dict.nav.rooms }]}
      />
      <main>
        <Rooms withHeading={false} />
        <Amenities />
        <BookingCta />
      </main>
    </>
  )
}
