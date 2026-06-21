import type { Metadata } from 'next'
import { LangUpdater } from '@/components/LangUpdater'
import { getDictionary, hasLocale } from './dictionaries'
import { notFound } from 'next/navigation'
import LenisProvider from '@/components/engine/LenisProvider'
import CustomCursor from '@/components/engine/CustomCursor'
import PageTransitionOverlay from '@/components/engine/PageTransitionOverlay'
import ThemeProvider from '@/components/providers/ThemeProvider'
import { DictProvider } from '@/components/providers/DictProvider'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CookieBanner from '@/components/layout/CookieBanner'

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> }

export async function generateStaticParams() {
  return [{ lang: 'hu' }, { lang: 'en' }, { lang: 'de' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return {
    metadataBase: new URL('https://vityillo.hu'),
    title: { default: dict.meta.title, template: `%s · Vityilló Vendégház` },
    description: dict.meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: { hu: '/hu', en: '/en', de: '/de' },
    },
    openGraph: {
      type: 'website',
      title: dict.meta.title,
      description: dict.meta.description,
      locale: lang,
      siteName: 'Vityilló Vendégház',
      images: [{ url: '/brand/icon-512.png', width: 512, height: 512, alt: 'Vityilló Vendégház' }],
    },
    twitter: {
      card: 'summary',
      title: dict.meta.title,
      description: dict.meta.description,
      images: ['/brand/icon-512.png'],
    },
  }
}

export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <ThemeProvider>
      <LenisProvider>
        <DictProvider dict={dict}>
          <LangUpdater lang={lang} />
          <PageTransitionOverlay />
          <CustomCursor />
          <Navbar />
          {children}
          <Footer />
          <CookieBanner />
        </DictProvider>
      </LenisProvider>
    </ThemeProvider>
  )
}
