import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import Script from 'next/script'
import { FX_BOOTSTRAP } from '@/lib/fx'
import './globals.css'

// No `weight` array: Google serves Playfair Display as a wght-axis variable
// font, so the four pinned weights all resolved to the same file anyway and
// only produced four redundant @font-face rules over it. Dropping the array
// keeps the identical download and lets any weight in 400-900 be used.
// NOTE: still latin-only, unchanged. Hungarian o-double-acute and
// u-double-acute live in latin-ext, so those glyphs fall back to the system
// serif mid-heading. Adding the subset fixes that but costs ~38 kB - a
// legibility call, not a performance one, so it is left as it was.
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vityilló Vendégház',
  description: 'Luxus vendégház Szomódon, a Szőlősor dűlőben.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#1A4731' },
    { media: '(prefers-color-scheme: light)', color: '#FFF4CC' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="hu"
      className={`${playfair.variable} ${inter.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {/* Effects budget before first paint - see lib/fx.ts. Has to land in
            the first style resolution, because globals.css keys the scroll-
            reveal start state off [data-fx]: decided a frame later, every
            revealed section would flash. */}
        <Script
          id="fx-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: FX_BOOTSTRAP }}
        />
        {/* Theme bootstrap before first paint: stored choice wins, otherwise
            follow the OS. Keep in sync with ThemeProvider.resolveInitialTheme. */}
        <Script
          id="theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vityillo-theme');var dark=t==='dark'||(t!=='light'&&!window.matchMedia('(prefers-color-scheme: light)').matches);if(dark)document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})()`,
          }}
        />
        {/* Scroll bootstrap before hydration: a reload mid-scroll otherwise restores
            the browser's remembered offset before CinematicStory's pinned, scrub-driven
            ScrollTrigger exists - its onEnter/onLeave callbacks are edge-triggered, so
            starting already past the pin's end means they never fire. Must run here
            (beforeInteractive), not in a React effect - that's after first paint, too
            late to preempt the browser's own restoration-on-reload. `behavior:'instant'`
            is required because <html> carries Tailwind's scroll-smooth class. */}
        <Script
          id="scroll-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if('scrollRestoration' in history)history.scrollRestoration='manual';window.scrollTo({top:0,left:0,behavior:'instant'});}catch(e){}})()`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
