'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { Menu, X, Sun, Moon, Search } from 'lucide-react'
import gsap from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useCommand } from '@/components/command/command-context'
import Logo from '@/components/brand/Logo'
import { MAIN_NAV, href, switchLocalePath } from '@/lib/nav'
import type { Locale } from '@/lib/types'

export default function Navbar() {
  const dict = useDict()
  const params = useParams()
  const pathname = usePathname()
  const lang = (params?.lang as Locale) ?? 'hu'
  const { theme, toggle } = useTheme()
  const { setOpen: setCommandOpen } = useCommand()

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const headerRef = useRef<HTMLElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

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
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Close the drawer with Escape and move focus into it when it opens
  useEffect(() => {
    if (!menuOpen) return
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuBtnRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

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

  // At the very top the navbar floats over a dark hero → light tone.
  // Once scrolled it sits on a solid theme surface → theme-aware tone.
  const linkColor = scrolled
    ? 'text-foreground/70 hover:text-foreground'
    : 'text-[rgba(255,244,204,0.8)] hover:text-[#FFF4CC]'
  const iconBtn = scrolled
    ? 'bg-foreground/[0.06] border-foreground/10 text-foreground/70 hover:text-foreground hover:bg-foreground/[0.12]'
    : 'bg-white/[0.08] border-white/15 text-[rgba(255,244,204,0.8)] hover:text-[#FFF4CC] hover:bg-white/[0.15]'

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
            <Logo variant="lockup" height={scrolled ? 34 : 38} tone={scrolled ? 'auto' : 'light'} priority />

            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {MAIN_NAV.map(({ dictKey, key, hash }) => (
                <Link
                  key={dictKey}
                  href={hash ? `${href(lang, key)}#${hash}` : href(lang, key)}
                  className={`text-sm font-sans transition-colors duration-200 tracking-wide cursor-pointer ${linkColor}`}
                  data-cursor="view"
                >
                  {dict.nav[dictKey]}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 lg:gap-3">
              <div className={`hidden sm:flex items-center gap-1 rounded-full px-2 py-1 border transition-colors duration-500 ${
                scrolled ? 'bg-foreground/[0.06] border-foreground/10' : 'bg-white/[0.08] border-white/15'
              }`}>
                {(['hu', 'en', 'de'] as Locale[]).map((l) => (
                  <Link
                    key={l}
                    href={switchLocalePath(pathname, l)}
                    aria-current={lang === l ? 'true' : undefined}
                    className={`text-[11px] font-sans px-2 py-0.5 rounded-full uppercase tracking-wider transition-all duration-200 ${
                      lang === l
                        ? scrolled ? 'bg-foreground text-background font-semibold' : 'bg-[#FFF4CC] text-[#1A4731] font-semibold'
                        : scrolled ? 'text-foreground/50 hover:text-foreground/80' : 'text-[rgba(255,244,204,0.6)] hover:text-[#FFF4CC]'
                    }`}
                  >
                    {l}
                  </Link>
                ))}
              </div>

              <button
                onClick={() => setCommandOpen(true)}
                aria-label={dict.command.title}
                aria-keyshortcuts="Meta+K Control+K"
                className={`hidden md:flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${iconBtn}`}
                data-cursor="view"
              >
                <Search size={13} aria-hidden />
                <kbd className="font-sans text-[10px] tracking-wider border border-current/25 rounded px-1 py-px opacity-70">
                  ⌘K
                </kbd>
              </button>

              <button
                onClick={toggle}
                aria-label={theme === 'dark' ? dict.nav.themeLight : dict.nav.themeDark}
                className={`p-2 rounded-full border transition-all duration-200 cursor-pointer ${iconBtn}`}
                data-cursor="view"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <Link
                href={href(lang, 'booking')}
                className={`hidden md:block text-sm font-sans font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:shadow-lg cursor-pointer ${
                  scrolled ? 'bg-foreground hover:bg-foreground/90 text-background' : 'bg-[#FFF4CC] hover:bg-[rgba(255,244,204,0.9)] text-[#1A4731]'
                }`}
                data-cursor="view"
              >
                {dict.nav.bookNow}
              </Link>

              <button
                ref={menuBtnRef}
                onClick={() => setMenuOpen((o) => !o)}
                className={`md:hidden p-2 transition-colors cursor-pointer ${scrolled ? 'text-foreground/70 hover:text-foreground' : 'text-[rgba(255,244,204,0.85)] hover:text-[#FFF4CC]'}`}
                aria-label={menuOpen ? dict.nav.menuClose : dict.nav.menuOpen}
                aria-expanded={menuOpen}
                aria-controls="mobile-drawer"
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
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={dict.nav.menuOpen}
        className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-background border-l border-foreground/[0.08] flex-col"
        style={{ display: 'none' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-foreground/[0.08]">
          <Logo variant="lockup" height={30} tone="auto" />
          <button
            ref={closeBtnRef}
            onClick={() => setMenuOpen(false)}
            className="p-1.5 text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
            aria-label={dict.nav.menuClose}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col p-5 gap-1 flex-1">
          {MAIN_NAV.map(({ dictKey, key, hash }) => (
            <Link
              key={dictKey}
              href={hash ? `${href(lang, key)}#${hash}` : href(lang, key)}
              onClick={() => setMenuOpen(false)}
              className="drawer-item text-left py-3 px-3 text-foreground/70 hover:text-foreground hover:bg-foreground/[0.05] rounded-lg font-sans text-base transition-all duration-200 cursor-pointer"
            >
              {dict.nav[dictKey]}
            </Link>
          ))}
        </nav>

        <div className="p-5 border-t border-foreground/[0.08]">
          <div className="flex gap-2 mb-3">
            {(['hu', 'en', 'de'] as Locale[]).map((l) => (
              <Link
                key={l}
                href={switchLocalePath(pathname, l)}
                onClick={() => setMenuOpen(false)}
                aria-current={lang === l ? 'true' : undefined}
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
            {theme === 'dark' ? dict.nav.themeLight : dict.nav.themeDark}
          </button>

          <Link
            href={href(lang, 'booking')}
            onClick={() => setMenuOpen(false)}
            className="drawer-item block text-center w-full bg-foreground hover:bg-foreground/90 text-background font-semibold py-3 rounded-full font-sans transition-colors cursor-pointer"
          >
            {dict.nav.bookNow}
          </Link>
        </div>
      </div>
    </>
  )
}
