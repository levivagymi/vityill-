import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'
import LegalContent from '@/components/legal/LegalContent'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return { title: dict.legal.imprint.title, description: dict.legal.imprint.intro, alternates: { canonical: `/${lang}/impresszum` } }
}

export default async function ImprintPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  return (
    <LegalContent
      title={dict.legal.imprint.title}
      intro={dict.legal.imprint.intro}
      sections={dict.legal.imprint.sections}
      updatedLabel={dict.legal.updated}
      updatedDate={dict.legal.updatedDate}
      crumbs={[{ label: dict.common.home, href: `/${lang}` }, { label: dict.footer.imprint }]}
    />
  )
}
