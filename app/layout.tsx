import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vityilló Vendégház',
  description: 'Luxus vendégház a Gerecse-hegység szívében, Szomódon.',
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
      {/* Theme bootstrap before first paint: stored choice wins, otherwise
          follow the OS. Keep in sync with ThemeProvider.resolveInitialTheme. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('vityillo-theme');var dark=t==='dark'||(t!=='light'&&!window.matchMedia('(prefers-color-scheme: light)').matches);if(dark)document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})()`,
        }}
      />
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}
