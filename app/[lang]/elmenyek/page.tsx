import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getDictionary, hasLocale } from '../dictionaries'
import PageHero from '@/components/ui/PageHero'
import Reveal from '@/components/ui/Reveal'
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

  return (
    <>
      <PageHero
        title={dict.experiences.title}
        subtitle={dict.experiences.heroSubtitle}
        image={HERO_BANNER}
        imageAlt={dict.experiences.title}
        crumbs={[{ label: dict.common.home, href: `/${lang}` }, { label: dict.nav.experiences }]}
      />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <Reveal className="max-w-2xl mx-auto text-center mb-20">
          <p className="font-heading text-2xl sm:text-3xl leading-snug text-foreground/85">{dict.experiences.intro}</p>
        </Reveal>

        <div className="space-y-20 lg:space-y-28">
          {EXPERIENCE_SLUGS.map((slug, i) => {
            const exp = dict.experiences[slug]
            const Icon = EXPERIENCE_ICONS[slug]
            const reversed = i % 2 === 1
            return (
              <Reveal key={slug} className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden ${reversed ? 'lg:order-2' : ''}`}>
                  <Image src={EXPERIENCE_SCENE_IMAGES[slug]} alt={exp.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                </div>
                <div className={reversed ? 'lg:order-1' : ''}>
                  <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] border border-foreground/10 flex items-center justify-center mb-5">
                    <Icon size={22} className="text-foreground" />
                  </div>
                  <p className="font-sans uppercase tracking-[0.3em] text-foreground/50 text-xs mb-3">{exp.eyebrow}</p>
                  <h2 className="font-heading text-2xl sm:text-3xl mb-4">{exp.title}</h2>
                  <p className="font-sans text-foreground/60 leading-[1.85] text-base mb-6">{exp.detail}</p>
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                    <Link
                      href={experienceHref(lang, slug)}
                      className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-foreground border border-foreground/25 hover:border-foreground/60 px-5 py-2.5 rounded-full transition-all cursor-pointer"
                      data-cursor="view"
                    >
                      {dict.experiences.explore} <ArrowRight size={15} />
                    </Link>
                    <Link
                      href={href(lang, 'booking')}
                      className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-foreground hover:gap-3 transition-all cursor-pointer"
                      data-cursor="view"
                    >
                      {dict.nav.bookNow} <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </main>

      <BookingCta />
    </>
  )
}
