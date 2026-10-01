'use client'
import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Cookie } from 'lucide-react'
import gsap from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import { href } from '@/lib/nav'
import { prefersReducedMotion } from '@/lib/utils'
import {
  OPEN_CONSENT_SETTINGS_EVENT,
  hasExternalConsent,
  setConsent,
  useConsent,
} from '@/lib/consent'
import type { Locale } from '@/lib/types'

// "Accept all" and "Necessary only" share one style on purpose: a refusal
// that is visually weaker than the acceptance is not a free choice
// (EDPB guidelines 03/2022 on deceptive design patterns).
const choiceButton =
  'flex-1 bg-foreground hover:bg-foreground/90 text-background font-sans font-semibold text-sm py-2.5 px-4 rounded-full transition-colors cursor-pointer'

/**
 * Consent banner for the one optional category the site has - external
 * content (the Google Maps embed). Shown while the visitor is undecided;
 * reopened into the detailed view by the footer's "cookie settings" control.
 *
 * Non-modal on purpose: it does not trap or steal focus on first visit, the
 * page stays usable behind it, and nothing optional loads until a choice is
 * made. It is a labelled region so screen-reader users can find it.
 */
export default function CookieBanner() {
  const dict = useDict()
  const c = dict.cookie
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const consent = useConsent()

  const [reopened, setReopened] = useState(false)
  const [view, setView] = useState<'summary' | 'settings'>('summary')
  /** null = untouched, so the checkbox mirrors the stored choice. */
  const [externalDraft, setExternalDraft] = useState<boolean | null>(null)
  /** Bumped on every footer reopen, to move focus into the banner. */
  const [openRequest, setOpenRequest] = useState(0)
  /** Keeps the banner mounted for its exit tween after the choice is saved. */
  const [closing, setClosing] = useState(false)

  const ref = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const externalId = useId()

  // `unknown` (server render + hydration pass) renders nothing, exactly like
  // the server HTML; the banner appears on the post-hydration render.
  const open = consent.status === 'undecided' || reopened || closing
  const externalChecked = externalDraft ?? hasExternalConsent(consent)

  useEffect(() => {
    const onOpen = () => {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      setExternalDraft(null)
      setView('settings')
      setReopened(true)
      setOpenRequest((n) => n + 1)
    }
    window.addEventListener(OPEN_CONSENT_SETTINGS_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_CONSENT_SETTINGS_EVENT, onOpen)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!open || !el) return
    const reduce = prefersReducedMotion()
    const tween = gsap.fromTo(
      el,
      { y: reduce ? 0 : 80, opacity: 0 },
      { y: 0, opacity: 1, duration: reduce ? 0 : 0.6, ease: 'power3.out', delay: reduce ? 0 : 0.4 },
    )
    return () => {
      tween.kill()
    }
  }, [open])

  useEffect(() => {
    if (openRequest === 0) return
    // An explicit request from the footer: the visitor is about to act on
    // the banner, so focus goes to its first control.
    ref.current?.querySelector<HTMLElement>('input, button')?.focus()
  }, [openRequest])

  const decide = (external: boolean) => {
    // Save first, animate second: the choice must never hinge on a tween
    // finishing - requestAnimationFrame is paused in background tabs.
    const el = ref.current
    setClosing(true)
    setReopened(false)
    setConsent({ external })
    // Same for focus: back to the opener (the footer control) right away.
    returnFocusRef.current?.focus()
    returnFocusRef.current = null
    const finish = () => {
      setClosing(false)
      setView('summary')
      setExternalDraft(null)
    }
    if (el && !prefersReducedMotion()) {
      gsap.to(el, { y: 80, opacity: 0, duration: 0.4, ease: 'power3.in', onComplete: finish })
    } else {
      finish()
    }
  }

  if (!open) return null

  return (
    <div
      ref={ref}
      role="region"
      aria-labelledby={titleId}
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[60] sm:max-w-md"
      style={{ opacity: 0 }}
    >
      <div
        data-lenis-prevent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-card/95 backdrop-blur-md border border-foreground/15 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/30"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-foreground/[0.08] border border-foreground/10 flex items-center justify-center shrink-0">
            <Cookie size={17} className="text-foreground" aria-hidden />
          </div>
          <h2 id={titleId} className="font-heading text-base text-foreground leading-tight pt-2">
            {c.title}
          </h2>
        </div>

        {view === 'summary' ? (
          <>
            <p className="text-sm font-sans text-muted-foreground leading-relaxed mb-4">
              {c.text}{' '}
              <Link href={href(lang, 'privacy')} className="text-foreground underline underline-offset-2">
                {c.more}
              </Link>
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={() => decide(true)} className={choiceButton}>
                {c.acceptAll}
              </button>
              <button type="button" onClick={() => decide(false)} className={choiceButton}>
                {c.necessaryOnly}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setView('settings')}
              className="mt-3 w-full text-center text-xs font-sans text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer"
            >
              {c.settings}
            </button>
          </>
        ) : (
          <>
            <fieldset className="space-y-3 mb-4">
              <legend className="sr-only">{c.settings}</legend>

              <div className="rounded-xl border border-foreground/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-sans font-semibold text-foreground">{c.necessaryTitle}</span>
                  <span className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground border border-foreground/15 rounded-full px-2 py-0.5">
                    {c.alwaysOn}
                  </span>
                </div>
                <p className="text-xs font-sans text-muted-foreground leading-relaxed mt-1.5">{c.necessaryText}</p>
              </div>

              <div className="rounded-xl border border-foreground/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor={externalId} className="text-sm font-sans font-semibold text-foreground cursor-pointer">
                    {c.externalTitle}
                  </label>
                  <input
                    id={externalId}
                    type="checkbox"
                    checked={externalChecked}
                    onChange={(e) => setExternalDraft(e.target.checked)}
                    aria-describedby={`${externalId}-desc`}
                    className="w-4 h-4 shrink-0 accent-[color:var(--foreground)] cursor-pointer"
                  />
                </div>
                <p id={`${externalId}-desc`} className="text-xs font-sans text-muted-foreground leading-relaxed mt-1.5">
                  {c.externalText}
                </p>
              </div>
            </fieldset>

            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={() => decide(externalChecked)} className={choiceButton}>
                {c.save}
              </button>
              <button type="button" onClick={() => decide(true)} className={choiceButton}>
                {c.acceptAll}
              </button>
            </div>
            <p className="mt-3 text-center">
              <Link
                href={href(lang, 'privacy')}
                className="text-xs font-sans text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                {c.more}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
