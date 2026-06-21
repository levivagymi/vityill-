'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Cookie } from 'lucide-react'
import gsap from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import { href } from '@/lib/nav'
import type { Locale } from '@/lib/types'

const STORAGE_KEY = 'vityillo-cookie-consent'

export default function CookieBanner() {
  const dict = useDict()
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      // Reading consent from a browser-only API after mount to decide visibility.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
    } catch {
      /* storage unavailable — keep banner hidden */
    }
  }, [])

  useEffect(() => {
    if (open && ref.current) {
      gsap.fromTo(ref.current, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.4 })
    }
  }, [open])

  const decide = (value: 'accepted' | 'declined') => {
    try { localStorage.setItem(STORAGE_KEY, value) } catch { /* ignore */ }
    if (ref.current) {
      gsap.to(ref.current, { y: 80, opacity: 0, duration: 0.4, ease: 'power3.in', onComplete: () => setOpen(false) })
    } else {
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={dict.cookie.title}
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[60] sm:max-w-md"
      style={{ opacity: 0 }}
    >
      <div className="bg-card/95 backdrop-blur-md border border-foreground/15 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/30">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-foreground/[0.08] border border-foreground/10 flex items-center justify-center shrink-0">
            <Cookie size={17} className="text-foreground" />
          </div>
          <div>
            <h3 className="font-heading text-base text-foreground leading-tight">{dict.cookie.title}</h3>
          </div>
        </div>
        <p className="text-sm font-sans text-foreground/55 leading-relaxed mb-4">
          {dict.cookie.text}{' '}
          <Link href={href(lang, 'privacy')} className="text-foreground/80 underline underline-offset-2 hover:text-foreground transition-colors">
            {dict.cookie.more}
          </Link>
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => decide('accepted')}
            className="flex-1 bg-foreground hover:bg-foreground/90 text-background font-sans font-semibold text-sm py-2.5 rounded-full transition-colors cursor-pointer"
          >
            {dict.cookie.accept}
          </button>
          <button
            onClick={() => decide('declined')}
            className="flex-1 border border-foreground/20 hover:border-foreground/40 text-foreground/70 hover:text-foreground font-sans text-sm py-2.5 rounded-full transition-colors cursor-pointer"
          >
            {dict.cookie.decline}
          </button>
        </div>
      </div>
    </div>
  )
}
