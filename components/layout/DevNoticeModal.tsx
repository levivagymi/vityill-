'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import gsap from '@/lib/gsap'
import type { Locale } from '@/lib/types'

const STORAGE_KEY = 'vityillo-dev-notice-seen'

/** Fired on window once the notice is dismissed, so queued overlays
 *  (e.g. CinematicSkipPrompt) know they may appear. */
export const DEV_NOTICE_DISMISSED_EVENT = 'vityillo:dev-notice-dismissed'

/** True when the visitor has already acknowledged the notice this session. */
export const devNoticeSeen = (): boolean => {
  try {
    return !!sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return true
  }
}

const COPY: Record<Locale, { badge: string; title: string; body: string; sub: string; btn: string }> = {
  hu: {
    badge: 'Fejlesztői verzió',
    title: 'FIGYELEM – Bemutató verzió',
    body: 'Ez az oldal jelenleg fejlesztés alatt áll és kizárólag bemutatási célokat szolgál. Az itt feltüntetett tartalmak (árak, elérhetőségek, szobainformációk, szolgáltatások) előzetes, tájékoztató jellegű, illusztrációs adatok, nem minősülnek ajánlattételnek és nem keletkeztetnek szerződéses jogviszonyt.',
    sub: 'A foglalási funkció nem aktív. Az üzemeltető a weboldalon megjelenő információk esetleges pontatlanságáért vagy hiányosságáért felelősséget nem vállal.',
    btn: 'Megértettem',
  },
  en: {
    badge: 'Developer preview',
    title: 'NOTICE – Preview version',
    body: 'This website is currently under development and is intended for demonstration purposes only. All content displayed (prices, availability, room information, services) is preliminary, illustrative and indicative in nature. It does not constitute an offer and does not create any contractual relationship.',
    sub: 'The booking function is not active. The operator accepts no liability for any inaccuracies or omissions in the information shown on this website.',
    btn: 'I understand',
  },
  de: {
    badge: 'Entwicklervorschau',
    title: 'HINWEIS – Vorschauversion',
    body: 'Diese Website befindet sich derzeit in der Entwicklung und dient ausschließlich zu Demonstrationszwecken. Alle angezeigten Inhalte (Preise, Verfügbarkeit, Zimmerinformationen, Dienstleistungen) sind vorläufig, illustrativ und unverbindlich. Sie stellen kein Angebot dar und begründen kein Vertragsverhältnis.',
    sub: 'Die Buchungsfunktion ist nicht aktiv. Der Betreiber übernimmt keine Haftung für etwaige Unrichtigkeiten oder Unvollständigkeiten der auf dieser Website angezeigten Informationen.',
    btn: 'Verstanden',
  },
}

export default function DevNoticeModal() {
  const params = useParams()
  const lang = ((params?.lang as string) ?? 'hu') as Locale
  const copy = COPY[lang] ?? COPY.hu
  const [open, setOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    try {
      // Reading visibility from a browser-only API after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!sessionStorage.getItem(STORAGE_KEY)) setOpen(true)
    } catch {
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    if (!open || !overlayRef.current || !cardRef.current) return
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
    gsap.fromTo(cardRef.current, { opacity: 0, y: 24, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out', delay: 0.05 })
    buttonRef.current?.focus()

    // Block page scroll behind the modal.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  const dismiss = () => {
    try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    const tl = gsap.timeline({
      onComplete: () => {
        setOpen(false)
        window.dispatchEvent(new Event(DEV_NOTICE_DISMISSED_EVENT))
      },
    })
    tl.to(cardRef.current, { opacity: 0, y: 16, scale: 0.97, duration: 0.3, ease: 'power2.in' })
    tl.to(overlayRef.current, { opacity: 0, duration: 0.25 }, '-=0.1')
  }

  // The notice is a blocking legal disclaimer: Escape acknowledges it,
  // matching the single available action.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9990] bg-black/70 backdrop-blur-sm"
        style={{ opacity: 0 }}
      />
      <div
        ref={cardRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dev-notice-title"
        className="fixed inset-0 z-[9991] flex items-center justify-center p-4"
        style={{ opacity: 0 }}
      >
        <div className="relative bg-card border border-foreground/20 rounded-2xl shadow-2xl shadow-black/40 max-w-md w-full p-7">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/35 rounded-full px-3 py-1 mb-5">
            <AlertTriangle size={13} className="text-amber-400 shrink-0" />
            <span className="text-amber-400 text-[11px] font-sans font-semibold uppercase tracking-wider">
              {copy.badge}
            </span>
          </div>

          <h2 id="dev-notice-title" className="font-heading text-foreground text-xl leading-tight mb-4">
            {copy.title}
          </h2>
          <p className="font-sans text-sm text-foreground/65 leading-relaxed mb-3">
            {copy.body}
          </p>
          <p className="font-sans text-xs text-foreground/45 leading-relaxed mb-7 border-t border-foreground/[0.08] pt-3">
            {copy.sub}
          </p>

          <button
            ref={buttonRef}
            onClick={dismiss}
            className="w-full bg-foreground hover:bg-foreground/90 text-background font-sans font-semibold text-sm py-3 rounded-xl transition-colors cursor-pointer"
          >
            {copy.btn}
          </button>
        </div>
      </div>
    </>
  )
}
