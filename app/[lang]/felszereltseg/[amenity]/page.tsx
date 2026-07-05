import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Flame, Waves, Trees, Lightbulb, Mountain, Wind, Tv, ChefHat, UtensilsCrossed, ArrowRight,
} from 'lucide-react'
import { getDictionary, hasLocale } from '../../dictionaries'
import PageHero from '@/components/ui/PageHero'
import Reveal from '@/components/ui/Reveal'
import BookingCta from '@/components/sections/BookingCta'
import { AMENITY_IMAGES, type AmenityKey } from '@/lib/content'
import { href, experienceHref, AMENITY_SLUGS, AMENITY_KEY_BY_SLUG, type AmenitySlug, type ExperienceSlug } from '@/lib/nav'

type Props = { params: Promise<{ lang: string; amenity: string }> }

const ICONS: Record<AmenityKey, React.ElementType> = {
  sauna: Flame, pool: Waves, forest: Trees, lighting: Lightbulb,
  view: Mountain, ac: Wind, tv: Tv, kitchen: ChefHat, grill: UtensilsCrossed,
}

/** Amenities with a matching immersive experience subpage deep-link into it. */
const SCENE_BY_KEY: Partial<Record<AmenityKey, ExperienceSlug>> = {
  sauna: 'sauna', pool: 'jacuzzi', grill: 'bograc',
}

export function generateStaticParams() {
  const langs = ['hu', 'en', 'de']
  return langs.flatMap((lang) => AMENITY_SLUGS.map((amenity) => ({ lang, amenity })))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, amenity } = await params
  if (!hasLocale(lang) || !AMENITY_SLUGS.includes(amenity as AmenitySlug)) return {}
  const dict = await getDictionary(lang)
  const a = dict.amenities[AMENITY_KEY_BY_SLUG[amenity as AmenitySlug]]
  return { title: a.name, description: a.desc, alternates: { canonical: `/${lang}/felszereltseg/${amenity}` } }
}

export default async function AmenityDetailPage({ params }: Props) {
  const { lang, amenity } = await params
  if (!hasLocale(lang) || !AMENITY_SLUGS.includes(amenity as AmenitySlug)) notFound()
  const dict = await getDictionary(lang)
  const slug = amenity as AmenitySlug
  const key = AMENITY_KEY_BY_SLUG[slug]
  const a = dict.amenities[key]
  const Icon = ICONS[key]
  const scene = SCENE_BY_KEY[key]

  return (
    <>
      <PageHero
        title={a.name}
        subtitle={a.desc}
        image={AMENITY_IMAGES[key]}
        imageAlt={a.name}
        crumbs={[
          { label: dict.common.home, href: `/${lang}` },
          { label: dict.nav.amenities, href: `/${lang}#amenities` },
          { label: a.name },
        ]}
      />

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <Reveal>
          <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] border border-foreground/10 flex items-center justify-center mb-6">
            <Icon size={22} className="text-foreground" />
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl mb-4">{dict.amenities.overviewTitle}</h2>
          <p className="font-sans text-foreground/60 leading-[1.85] text-base mb-10">{a.detail}</p>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {scene && (
              <Link
                href={experienceHref(lang, scene)}
                className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-foreground border border-foreground/25 hover:border-foreground/60 px-5 py-2.5 rounded-full transition-all cursor-pointer"
                data-cursor="view"
              >
                {dict.amenities.exploreCta} <ArrowRight size={15} />
              </Link>
            )}
            <Link
              href={href(lang, 'booking')}
              className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-foreground hover:gap-3 transition-all cursor-pointer"
              data-cursor="view"
            >
              {dict.nav.bookNow} <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
      </main>

      <BookingCta />
    </>
  )
}
