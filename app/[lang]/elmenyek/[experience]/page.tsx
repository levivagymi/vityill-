import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../../dictionaries'
import SubpageShell from '@/components/experience/SubpageShell'
import ExperienceScene from '@/components/experience/ExperienceScene'
import { EXPERIENCE_SLUGS, type ExperienceSlug } from '@/lib/nav'
import { EXPERIENCE_SCENE_IMAGES } from '@/lib/content'

type Props = { params: Promise<{ lang: string; experience: string }> }

export function generateStaticParams() {
  const langs = ['hu', 'en', 'de']
  return langs.flatMap((lang) => EXPERIENCE_SLUGS.map((experience) => ({ lang, experience })))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, experience } = await params
  if (!hasLocale(lang) || !EXPERIENCE_SLUGS.includes(experience as ExperienceSlug)) return {}
  const dict = await getDictionary(lang)
  const exp = dict.experiences[experience as ExperienceSlug]
  return {
    title: exp.title,
    description: exp.desc,
    alternates: { canonical: `/${lang}/elmenyek/${experience}` },
  }
}

export default async function ExperienceSubpage({ params }: Props) {
  const { lang, experience } = await params
  if (!hasLocale(lang) || !EXPERIENCE_SLUGS.includes(experience as ExperienceSlug)) notFound()
  const dict = await getDictionary(lang)
  const slug = experience as ExperienceSlug
  const exp = dict.experiences[slug]

  return (
    <SubpageShell
      slug={slug}
      eyebrow={exp.eyebrow}
      title={exp.title}
      desc={exp.desc}
      detail={exp.detail}
    >
      <ExperienceScene
        slug={slug}
        fallbackImage={EXPERIENCE_SCENE_IMAGES[slug]}
        fallbackAlt={exp.title}
      />
    </SubpageShell>
  )
}
