import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'
import ExperiencesScroll from '@/components/sections/ExperiencesScroll'
import BookingCta from '@/components/sections/BookingCta'
import { EXPERIENCE_ICONS } from '@/components/experience/experience-icons'
import { EXPERIENCE_SCENE_IMAGES, HERO_BANNER } from '@/lib/content'
import { href, experienceHref, EXPERIENCE_SLUGS } from '@/lib/nav'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return { title: dict.experiences.title, description: dict.experiences.subtitle, alternates: { canonical: `/${lang}/elmenyek` } }
}

export default async function ExperiencesPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  const items = EXPERIENCE_SLUGS.map((slug) => {
    const exp = dict.experiences[slug]
    const Icon = EXPERIENCE_ICONS[slug]
    return {
      slug,
      eyebrow: exp.eyebrow,
      title: exp.title,
      detail: exp.detail,
      image: EXPERIENCE_SCENE_IMAGES[slug],
      icon: <Icon size={22} className="text-foreground" />,
      exploreHref: experienceHref(lang, slug),
    }
  })

  return (
    <>
      <ExperiencesScroll
        heroTitle={dict.experiences.title}
        heroSubtitle={dict.experiences.heroSubtitle}
        heroImage={HERO_BANNER}
        heroImageAlt={dict.experiences.title}
        heroCrumbs={[{ label: dict.common.home, href: `/${lang}` }, { label: dict.nav.experiences }]}
        intro={dict.experiences.intro}
        items={items}
        exploreLabel={dict.experiences.explore}
        bookNowLabel={dict.nav.bookNow}
        bookHref={href(lang, 'booking')}
      />

      <BookingCta />
    </>
  )
}
