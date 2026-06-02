import type { Metadata } from 'next'
import { LangUpdater } from '@/components/LangUpdater'
import { getDictionary, hasLocale } from './dictionaries'
import { notFound } from 'next/navigation'
import LenisProvider from '@/components/engine/LenisProvider'
import CustomCursor from '@/components/engine/CustomCursor'
import PageTransitionOverlay from '@/components/engine/PageTransitionOverlay'
import ThemeProvider from '@/components/providers/ThemeProvider'

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> }

export async function generateStaticParams() {
  return [{ lang: 'hu' }, { lang: 'en' }, { lang: 'de' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      locale: lang,
    },
  }
}

export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  return (
    <ThemeProvider>
      <LenisProvider>
        <LangUpdater lang={lang} />
        <PageTransitionOverlay />
        <CustomCursor />
        {children}
      </LenisProvider>
    </ThemeProvider>
  )
}
