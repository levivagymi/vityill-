import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'
import PageHero from '@/components/ui/PageHero'
import Gallery from '@/components/sections/Gallery'
import BookingCta from '@/components/sections/BookingCta'
import { GALLERY_IMAGES } from '@/lib/content'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return { title: dict.gallery.title, description: dict.gallery.subtitle, alternates: { canonical: `/${lang}/galeria` } }
}

export default async function GalleryPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <>
      <PageHero
        title={dict.gallery.title}
        subtitle={dict.gallery.heroSubtitle}
        image={GALLERY_IMAGES[0].src}
        imageAlt={dict.gallery.title}
        crumbs={[{ label: dict.common.home, href: `/${lang}` }, { label: dict.nav.gallery }]}
      />
      <main className="pt-6">
        <Gallery withHeading={false} />
        <BookingCta />
      </main>
    </>
  )
}
