'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Phone, Mail, MapPin } from 'lucide-react'
import gsap from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import Logo from '@/components/brand/Logo'
import { MAIN_NAV, href } from '@/lib/nav'
import type { Locale } from '@/lib/types'

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
)

export default function Footer() {
  const dict = useDict()
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        footerRef.current!.querySelectorAll('.footer-col'),
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: footerRef.current, start: 'top 90%' },
        }
      )
    }, footerRef)
    return () => ctx.revert()
  }, [])

  const legalLinks: { key: 'imprint' | 'privacy' | 'terms'; label: string }[] = [
    { key: 'imprint', label: dict.footer.imprint },
    { key: 'privacy', label: dict.footer.privacy },
    { key: 'terms', label: dict.footer.terms },
  ]

  return (
    <footer ref={footerRef} className="border-t border-foreground/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div className="footer-col lg:col-span-1">
            <Logo variant="full" height={84} tone="auto" className="mb-2" />
            <p className="text-sm text-foreground/45 font-sans leading-relaxed mt-4 max-w-xs">
              {dict.footer.tagline}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 border border-foreground/20 rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
              <span className="text-[11px] font-sans text-foreground/60 tracking-wider uppercase">
                {dict.footer.ntak}
              </span>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-foreground/40 mb-5">
              {dict.footer.contact}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-foreground/55 font-sans">
                <Phone size={14} className="text-foreground/60 shrink-0" />
                <a href={`tel:${dict.footer.phone.replace(/\s/g, '')}`} className="hover:text-foreground transition-colors">
                  {dict.footer.phone}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/55 font-sans">
                <Mail size={14} className="text-foreground/60 shrink-0" />
                <a href={`mailto:${dict.footer.email}`} className="hover:text-foreground transition-colors">
                  {dict.footer.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-foreground/55 font-sans">
                <MapPin size={14} className="text-foreground/60 shrink-0 mt-0.5" />
                <span>{dict.footer.address}</span>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-foreground/40 mb-5">
              {dict.footer.navTitle}
            </h4>
            <ul className="space-y-2">
              {MAIN_NAV.map(({ dictKey, key, hash }) => (
                <li key={dictKey}>
                  <Link
                    href={hash ? `${href(lang, key)}#${hash}` : href(lang, key)}
                    className="text-sm text-foreground/55 hover:text-foreground font-sans transition-colors cursor-pointer"
                  >
                    {dict.nav[dictKey]}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={href(lang, 'booking')}
                  className="text-sm text-foreground/55 hover:text-foreground font-sans transition-colors cursor-pointer"
                >
                  {dict.nav.book}
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-foreground/40 mb-5">
              {dict.footer.legal}
            </h4>
            <ul className="space-y-2 mb-7">
              {legalLinks.map(({ key, label }) => (
                <li key={key}>
                  <Link
                    href={href(lang, key)}
                    className="text-sm text-foreground/55 hover:text-foreground font-sans transition-colors cursor-pointer"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-foreground/40 mb-3">
              {dict.footer.social}
            </h4>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full border border-foreground/[0.12] flex items-center justify-center text-foreground/50 hover:text-foreground hover:border-foreground/40 transition-all"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full border border-foreground/[0.12] flex items-center justify-center text-foreground/50 hover:text-foreground hover:border-foreground/40 transition-all"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-foreground/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-foreground/40 font-sans">
            © {new Date().getFullYear()} Vityilló Vendégház. {dict.footer.rights}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {legalLinks.map(({ key, label }) => (
              <Link key={key} href={href(lang, key)} className="text-xs text-foreground/40 hover:text-foreground/70 font-sans transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
