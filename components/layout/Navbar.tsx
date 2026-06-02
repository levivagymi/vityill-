'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Menu, X, Sun, Moon } from 'lucide-react'
import gsap from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import type { Locale } from '@/lib/types'

const NAV_LINKS = ['about', 'amenities', 'rooms', 'gallery', 'book', 'location'] as const

export default function Navbar() {
  const dict = useDict()
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const { theme, toggle } = useTheme()

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const headerRef = useRef<HTMLElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 }
      )
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const drawer = drawerRef.current
    const backdrop = backdropRef.current
    if (!drawer || !backdrop) return

    if (menuOpen) {
      gsap.set(drawer, { display: 'flex' })
      gsap.set(backdrop, { display: 'block' })
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      gsap.fromTo(drawer, { x: '100%' }, { x: '0%', duration: 0.4, ease: 'power3.out' })
      const items = drawer.querySelectorAll('.drawer-item')
      gsap.fromTo(items,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, stagger: 0.05, duration: 0.35, ease: 'power2.out', delay: 0.15 }
      )
    } else {
      gsap.to(backdrop, { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => gsap.set(backdrop, { display: 'none' }) })
      gsap.to(drawer, { x: '100%', duration: 0.35, ease: 'power3.in', onComplete: () => gsap.set(drawer, { display: 'none' }) })
    }
  }, [menuOpen])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    const el = document.getElementById(id === 'book' ? 'booking' : id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-background/95 backdrop-blur-md border-b border-foreground/[0.08] shadow-xl shadow-black/20'
            : 'bg-transparent'
        }`}
        style={{ opacity: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href={`/${lang}`} className="flex flex-col group" data-cursor="view">
              <span className="font-heading text-lg lg:text-xl font-semibold text-foreground tracking-wide">
                Vityilló
              </span>
              <span className="text-[10px] lg:text-xs uppercase tracking-[0.2em] text-foreground/40 font-sans leading-none">
                Vendégház
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {NAV_LINKS.map((key) => (
                <button
                  key={key}
                  onClick={() => scrollTo(key)}
                  className="text-sm font-sans text-foreground/70 hover:text-foreground transition-colors duration-200 tracking-wide cursor-pointer"
                  data-cursor="view"
                >
                  {dict.nav[key]}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 lg:gap-3">
              <div className="hidden sm:flex items-center gap-1 bg-foreground/[0.06] rounded-full px-2 py-1 border border-foreground/10">
                {(['hu', 'en', 'de'] as Locale[]).map((l) => (
                  <Link
                    key={l}
                    href={`/${l}`}
                    className={`text-[11px] font-sans px-2 py-0.5 rounded-full uppercase tracking-wider transition-all duration-200 ${
                      lang === l
                        ? 'bg-foreground text-background font-semibold'
                        : 'text-foreground/50 hover:text-foreground/80'
                    }`}
                  >
                    {l}
                  </Link>
                ))}
              </div>

              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="p-2 rounded-full bg-foreground/[0.06] border border-foreground/10 text-foreground/70 hover:text-foreground hover:bg-foreground/[0.12] transition-all duration-200 cursor-pointer"
                data-cursor="view"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <button
                onClick={() => scrollTo('book')}
                className="hidden md:block text-sm font-sans bg-foreground hover:bg-foreground/90 text-background font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:shadow-lg cursor-pointer"
                data-cursor="view"
              >
                {dict.nav.bookNow}
              </button>

              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="md:hidden p-2 text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        ref={backdropRef}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        style={{ display: 'none' }}
        onClick={() => setMenuOpen(false)}
      />

      <div
        ref={drawerRef}
        className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-background border-l border-foreground/[0.08] flex-col"
        style={{ display: 'none' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-foreground/[0.08]">
          <span className="font-heading text-foreground text-lg">Vityilló</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1.5 text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col p-5 gap-1 flex-1">
          {NAV_LINKS.map((key) => (
            <button
              key={key}
              onClick={() => scrollTo(key)}
              className="drawer-item text-left py-3 px-3 text-foreground/70 hover:text-foreground hover:bg-foreground/[0.05] rounded-lg font-sans text-base transition-all duration-200 cursor-pointer"
            >
              {dict.nav[key]}
            </button>
          ))}
        </nav>

        <div className="p-5 border-t border-foreground/[0.08]">
          <div className="flex gap-2 mb-3">
            {(['hu', 'en', 'de'] as Locale[]).map((l) => (
              <Link
                key={l}
                href={`/${l}`}
                onClick={() => setMenuOpen(false)}
                className={`drawer-item flex-1 text-center text-sm py-2 rounded-lg uppercase tracking-wider font-sans transition-all ${
                  lang === l
                    ? 'bg-foreground text-background font-bold'
                    : 'bg-foreground/[0.06] text-foreground/50 hover:text-foreground/80'
                }`}
              >
                {l}
              </Link>
            ))}
          </div>

          <button
            onClick={toggle}
            className="drawer-item w-full flex items-center justify-center gap-2 bg-foreground/[0.06] border border-foreground/10 text-foreground/70 hover:text-foreground py-2.5 rounded-full font-sans text-sm transition-all mb-3 cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Világos mód' : 'Sötét mód'}
          </button>

          <button
            onClick={() => scrollTo('book')}
            className="drawer-item w-full bg-foreground hover:bg-foreground/90 text-background font-semibold py-3 rounded-full font-sans transition-colors cursor-pointer"
          >
            {dict.nav.bookNow}
          </button>
        </div>
      </div>
    </>
  )
}
