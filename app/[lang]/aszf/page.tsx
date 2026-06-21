import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'
import LegalContent from '@/components/legal/LegalContent'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return { title: dict.legal.terms.title, description: dict.legal.terms.intro, alternates: { canonical: `/${lang}/aszf` } }
}

export default async function TermsPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  return (
    <LegalContent
      title={dict.legal.terms.title}
      intro={dict.legal.terms.intro}
      sections={dict.legal.terms.sections}
      updatedLabel={dict.legal.updated}
      updatedDate={dict.legal.updatedDate}
      crumbs={[{ label: dict.common.home, href: `/${lang}` }, { label: dict.footer.terms }]}
    />
  )
}
