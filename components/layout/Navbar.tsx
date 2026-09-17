'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { Menu, X, Sun, Moon, Search, ChevronDown } from 'lucide-react'
import { NavigationMenu } from '@base-ui/react/navigation-menu'
import gsap from '@/lib/gsap'
import { fxFull } from '@/lib/fx'
import { useDict } from '@/components/providers/DictProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useCommand } from '@/components/command/command-context'
import Logo from '@/components/brand/Logo'
import Magnetic from '@/components/ui/Magnetic'
import { EXPERIENCE_ICONS } from '@/components/experience/experience-icons'
import {
  MAIN_NAV, href, switchLocalePath,
  ROOM_SLUGS, ROOM_KEY_BY_SLUG, roomHref,
  EXPERIENCE_SLUGS, experienceHref,
} from '@/lib/nav'
import type { Locale } from '@/lib/types'

type NavSubItem = { key: string; label: string; sublabel: string; href: string; icon?: React.ReactNode }

export default function Navbar() {
  const dict = useDict()
  const params = useParams()
  const pathname = usePathname()
  const lang = (params?.lang as Locale) ?? 'hu'
  const { theme, toggle } = useTheme()
  const { setOpen: setCommandOpen } = useCommand()

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const headerRef = useRef<HTMLElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  // Closes the drawer and collapses any open accordion sub-list, so the next open starts fresh.
  const closeDrawer = () => { setMenuOpen(false); setExpandedKey(null) }

  useEffect(() => {
    // The header carries .fx-reveal, which only resolves to opacity:0 under
    // data-fx="full" - in lite mode it is already visible and this drop-in is
    // skipped entirely.
    if (!fxFull()) return
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
    const onResize = () => { if (window.innerWidth >= 768) closeDrawer() }
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
        closeDrawer()
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
    ? 'text-muted-foreground hover:text-foreground'
    : 'text-on-dark-muted hover:text-on-dark-strong'
  const iconBtn = scrolled
    ? 'bg-foreground/[0.06] border-foreground/10 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.12]'
    : 'bg-white/[0.08] border-white/15 text-on-dark-muted hover:text-on-dark-strong hover:bg-white/[0.15]'

  // Nav items that lead to sub-pages get a dropdown listing them directly,
  // instead of only being reachable via an extra click-through or ⌘K.
  const roomSubItems: NavSubItem[] = ROOM_SLUGS.map((slug) => {
    const r = dict.rooms[ROOM_KEY_BY_SLUG[slug]]
    return { key: slug, label: r.name, sublabel: r.tagline, href: roomHref(lang, slug) }
  })
  const experienceSubItems: NavSubItem[] = EXPERIENCE_SLUGS.map((slug) => {
    const exp = dict.experiences[slug]
    const Icon = EXPERIENCE_ICONS[slug]
    return {
      key: slug, label: exp.title, sublabel: exp.eyebrow, href: experienceHref(lang, slug),
      icon: <Icon size={16} className="text-foreground shrink-0" aria-hidden />,
    }
  })
  const SUBMENUS: Partial<Record<(typeof MAIN_NAV)[number]['dictKey'], NavSubItem[]>> = {
    rooms: roomSubItems,
    experiences: experienceSubItems,
  }

  return (
    <>
      <header
        ref={headerRef}
        className={`fx-reveal fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-background/95 backdrop-blur-md border-b border-foreground/[0.08] shadow-xl shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Logo variant="lockup" height={scrolled ? 34 : 38} tone={scrolled ? 'auto' : 'light'} />

            <NavigationMenu.Root className="hidden md:block">
              <NavigationMenu.List className="flex items-center gap-6 lg:gap-8">
                {MAIN_NAV.map(({ dictKey, key, hash }) => {
                  const subItems = SUBMENUS[dictKey]
                  if (!subItems) {
                    return (
                      <NavigationMenu.Link
                        key={dictKey}
                        render={<Link href={hash ? `${href(lang, key)}#${hash}` : href(lang, key)} data-cursor="view" />}
                        className={`text-sm font-sans transition-colors duration-200 tracking-wide cursor-pointer ${linkColor}`}
                      >
                        {dict.nav[dictKey]}
                      </NavigationMenu.Link>
                    )
                  }
                  return (
                    <NavigationMenu.Item key={dictKey}>
                      <NavigationMenu.Trigger
                        render={<Link href={hash ? `${href(lang, key)}#${hash}` : href(lang, key)} data-cursor="view" />}
                        nativeButton={false}
                        className={`group flex items-center gap-1 text-sm font-sans transition-colors duration-200 tracking-wide cursor-pointer ${linkColor}`}
                      >
                        {dict.nav[dictKey]}
                        <ChevronDown size={13} className="transition-transform duration-200 group-data-[popup-open]:rotate-180" aria-hidden />
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content
                        className={`p-2 grid gap-0.5 ${subItems.length > 4 ? 'grid-cols-2 w-[min(90vw,520px)]' : 'grid-cols-1 w-[min(90vw,320px)]'}`}
                      >
                        {subItems.map((item) => (
                          <NavigationMenu.Link
                            key={item.key}
                            render={<Link href={item.href} data-cursor="view" />}
                            className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 hover:bg-foreground/[0.05] transition-colors duration-200 cursor-pointer"
                          >
                            {item.icon}
                            <span className="flex flex-col">
                              <span className="text-sm font-sans text-foreground">{item.label}</span>
                              <span className="text-xs font-sans text-muted-foreground">{item.sublabel}</span>
                            </span>
                          </NavigationMenu.Link>
                        ))}
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>
                  )
                })}
              </NavigationMenu.List>

              <NavigationMenu.Portal>
                <NavigationMenu.Positioner sideOffset={14} collisionPadding={16} className="z-50 box-border">
                  <NavigationMenu.Popup
                    className="relative rounded-2xl border border-foreground/[0.08] bg-background/95 backdrop-blur-md shadow-xl shadow-black/20 overflow-hidden
                               transition-[opacity,transform] duration-300 [transition-timing-function:var(--ease-cinematic)]
                               data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.97]
                               data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.97]"
                  >
                    <NavigationMenu.Viewport />
                  </NavigationMenu.Popup>
                </NavigationMenu.Positioner>
              </NavigationMenu.Portal>
            </NavigationMenu.Root>

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
                        : scrolled ? 'text-muted-foreground hover:text-foreground' : 'text-on-dark-muted hover:text-on-dark-strong'
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
                <kbd className="font-sans text-[10px] tracking-wider border border-current/25 rounded px-1 py-px">
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

              <div className="hidden md:block">
                <Magnetic>
                  <Link
                    href={href(lang, 'booking')}
                    className={`block text-sm font-sans font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:shadow-lg cursor-pointer ${
                      scrolled ? 'bg-foreground hover:bg-foreground/90 text-background' : 'bg-[#FFF4CC] hover:bg-[rgba(255,244,204,0.9)] text-[#1A4731]'
                    }`}
                    data-cursor="view"
                  >
                    {dict.nav.bookNow}
                  </Link>
                </Magnetic>
              </div>

              <button
                ref={menuBtnRef}
                onClick={() => setMenuOpen((o) => !o)}
                className={`md:hidden p-2 transition-colors cursor-pointer ${scrolled ? 'text-muted-foreground hover:text-foreground' : 'text-on-dark-muted hover:text-on-dark-strong'}`}
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
        className="fixed inset-0 z-40 bg-[#0a1f14]/60 backdrop-blur-sm"
        style={{ display: 'none' }}
        onClick={closeDrawer}
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
            onClick={closeDrawer}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label={dict.nav.menuClose}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col p-5 gap-1 flex-1">
          <button
            onClick={() => { closeDrawer(); setCommandOpen(true) }}
            className="drawer-item flex items-center gap-2.5 text-left py-3 px-3 mb-2 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] rounded-lg font-sans text-base transition-all duration-200 cursor-pointer border-b border-foreground/[0.08]"
          >
            <Search size={16} aria-hidden />
            {dict.command.title}
          </button>
          {MAIN_NAV.map(({ dictKey, key, hash }) => {
            const subItems = SUBMENUS[dictKey]
            if (!subItems) {
              return (
                <Link
                  key={dictKey}
                  href={hash ? `${href(lang, key)}#${hash}` : href(lang, key)}
                  onClick={closeDrawer}
                  className="drawer-item text-left py-3 px-3 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] rounded-lg font-sans text-base transition-all duration-200 cursor-pointer"
                >
                  {dict.nav[dictKey]}
                </Link>
              )
            }
            const isExpanded = expandedKey === dictKey
            return (
              <div key={dictKey} className="drawer-item">
                <div className="flex items-center gap-1">
                  <Link
                    href={hash ? `${href(lang, key)}#${hash}` : href(lang, key)}
                    onClick={closeDrawer}
                    className="flex-1 text-left py-3 px-3 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] rounded-lg font-sans text-base transition-all duration-200 cursor-pointer"
                  >
                    {dict.nav[dictKey]}
                  </Link>
                  <button
                    onClick={() => setExpandedKey(isExpanded ? null : dictKey)}
                    aria-expanded={isExpanded}
                    aria-label={dict.nav[dictKey]}
                    className="p-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden />
                  </button>
                </div>
                {isExpanded && (
                  <div className="flex flex-col gap-0.5 pl-4 pb-1">
                    {subItems.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={closeDrawer}
                        className="text-left py-2.5 px-3 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] rounded-lg font-sans text-sm transition-all duration-200 cursor-pointer"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="p-5 border-t border-foreground/[0.08]">
          <div className="flex gap-2 mb-3">
            {(['hu', 'en', 'de'] as Locale[]).map((l) => (
              <Link
                key={l}
                href={switchLocalePath(pathname, l)}
                onClick={closeDrawer}
                aria-current={lang === l ? 'true' : undefined}
                className={`drawer-item flex-1 text-center text-sm py-2 rounded-lg uppercase tracking-wider font-sans transition-all ${
                  lang === l
                    ? 'bg-foreground text-background font-bold'
                    : 'bg-foreground/[0.06] text-muted-foreground hover:text-foreground'
                }`}
              >
                {l}
              </Link>
            ))}
          </div>

          <button
            onClick={toggle}
            className="drawer-item w-full flex items-center justify-center gap-2 bg-foreground/[0.06] border border-foreground/10 text-muted-foreground hover:text-foreground py-2.5 rounded-full font-sans text-sm transition-all mb-3 cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? dict.nav.themeLight : dict.nav.themeDark}
          </button>

          <div className="drawer-item">
            <Magnetic className="w-full">
              <Link
                href={href(lang, 'booking')}
                onClick={closeDrawer}
                className="block text-center w-full bg-foreground hover:bg-foreground/90 text-background font-semibold py-3 rounded-full font-sans transition-colors cursor-pointer"
              >
                {dict.nav.bookNow}
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>
    </>
  )
}
