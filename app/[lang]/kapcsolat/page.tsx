import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Phone, Mail, MapPin, Clock, ExternalLink } from 'lucide-react'
import { getDictionary, hasLocale } from '../dictionaries'
import PageHero from '@/components/ui/PageHero'
import ContactForm from '@/components/contact/ContactForm'
import { HERO_BANNER } from '@/lib/content'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return { title: dict.contact.title, description: dict.contact.subtitle, alternates: { canonical: `/${lang}/kapcsolat` } }
}

export default async function ContactPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const c = dict.contact

  return (
    <>
      <PageHero
        title={c.title}
        subtitle={c.heroSubtitle}
        image={HERO_BANNER}
        imageAlt={c.title}
        crumbs={[{ label: dict.common.home, href: `/${lang}` }, { label: dict.nav.contact }]}
      />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <ContactForm />

          <div className="space-y-6">
            <div className="bg-foreground/[0.03] border border-foreground/[0.07] rounded-2xl p-6 sm:p-8">
              <h3 className="font-heading text-xl mb-6">{c.infoTitle}</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm font-sans text-foreground/70">
                  <span className="w-9 h-9 rounded-xl bg-foreground/[0.06] border border-foreground/10 flex items-center justify-center shrink-0">
                    <Phone size={15} className="text-foreground" />
                  </span>
                  <a href={`tel:${dict.footer.phone.replace(/\s/g, '')}`} className="hover:text-foreground transition-colors">{dict.footer.phone}</a>
                </li>
                <li className="flex items-center gap-3 text-sm font-sans text-foreground/70">
                  <span className="w-9 h-9 rounded-xl bg-foreground/[0.06] border border-foreground/10 flex items-center justify-center shrink-0">
                    <Mail size={15} className="text-foreground" />
                  </span>
                  <a href={`mailto:${dict.footer.email}`} className="hover:text-foreground transition-colors">{dict.footer.email}</a>
                </li>
                <li className="flex items-start gap-3 text-sm font-sans text-foreground/70">
                  <span className="w-9 h-9 rounded-xl bg-foreground/[0.06] border border-foreground/10 flex items-center justify-center shrink-0">
                    <MapPin size={15} className="text-foreground" />
                  </span>
                  <span>{dict.location.address}</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-sans text-foreground/70">
                  <span className="w-9 h-9 rounded-xl bg-foreground/[0.06] border border-foreground/10 flex items-center justify-center shrink-0">
                    <Clock size={15} className="text-foreground" />
                  </span>
                  <span>
                    {c.checkInTime}<br />{c.checkOutTime}
                  </span>
                </li>
              </ul>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=47.696310,18.325239"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-sans font-semibold text-foreground hover:gap-3 transition-all"
              >
                {c.directions} <ExternalLink size={14} />
              </a>
            </div>

            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-foreground/[0.08]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4141.433965054247!2d18.325239263444374!3d47.696310253120345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x476a4f3c8d51135d%3A0xb90cf9714fdda3b!2zVml0eWlsbMOzIFZlbmTDqWdow6F6!5e0!3m2!1shu!2shu!4v1788459810620!5m2!1shu!2shu"
                width="100%"
                height="100%"
                style={{ border: 'none', filter: 'invert(85%) hue-rotate(165deg) brightness(0.8) contrast(0.9)' }}
                title="Vityilló Vendégház, Szomód"
                loading="lazy"
                className="absolute inset-0"
              />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
