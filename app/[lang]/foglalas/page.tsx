import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'
import PageHero from '@/components/ui/PageHero'
import BookingWizard from '@/components/booking/BookingWizard'
import { HERO_BANNER } from '@/lib/content'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return { title: dict.booking.title, description: dict.booking.subtitle, alternates: { canonical: `/${lang}/foglalas` } }
}

export default async function BookingPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <>
      <PageHero
        title={dict.booking.title}
        subtitle={dict.booking.heroSubtitle}
        image={HERO_BANNER}
        imageAlt={dict.meta.title}
        crumbs={[{ label: dict.common.home, href: `/${lang}` }, { label: dict.nav.book }]}
      />
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <BookingWizard />
      </main>
    </>
  )
}
