'use client'
import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { fxFull } from '@/lib/fx'
import { hasExternalConsent, setConsent, useConsent } from '@/lib/consent'
import { useDict } from '@/components/providers/DictProvider'

/** The Google Maps embed for Szomód, Szőlősor dűlő 119. */
const MAP_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4141.433965054247!2d18.325239263444374!3d47.696310253120345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x476a4f3c8d51135d%3A0xb90cf9714fdda3b!2zVml0eWlsbMOzIFZlbmTDqWdow6F6!5e0!3m2!1shu!2shu!4v1788459810620!5m2!1shu!2shu'

/**
 * The map embed is a third party: the moment it loads, Google receives the
 * visitor's IP and may set cookies, so it needs consent (lib/consent.ts).
 * Without it, the panel is a placeholder offering a one-off load or a
 * standing "always allow". Nothing is fetched from Google before either.
 *
 * With consent, two performance guards still apply - the embed pulls in well
 * over a megabyte of script and tiles:
 *   full mode — mounted by IntersectionObserver, only once the panel is
 *     genuinely approaching the viewport (`loading="lazy"` alone fetches it
 *     while the visitor is still in the hero on a fast connection).
 *   lite mode — never fetched without an explicit tap.
 * Every placeholder keeps the panel's box, so the swap costs no layout shift.
 */
export default function LocationMap({ title, loadLabel }: { title: string; loadLabel: string }) {
  const dict = useDict()
  const consent = useConsent()
  const allowed = hasExternalConsent(consent)
  const ref = useRef<HTMLDivElement>(null)
  /** Full mode: the panel is near the viewport. */
  const [near, setNear] = useState(false)
  /** Lite mode: loading waits for a tap even with consent. */
  const [needsTap, setNeedsTap] = useState(false)
  /** An explicit tap - a one-off consent and/or the lite-mode load. */
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    if (!fxFull()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNeedsTap(true)
      return
    }
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '150px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const show = requested || (allowed && near && !needsTap)

  const allowAlways = () => {
    setConsent({ external: true })
    setRequested(true)
  }

  return (
    <div ref={ref} className="absolute inset-0">
      {show ? (
        <iframe
          src={MAP_SRC}
          width="100%"
          height="100%"
          style={{
            border: 'none',
            filter: 'invert(85%) hue-rotate(165deg) brightness(0.8) contrast(0.9)',
          }}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0"
        />
      ) : consent.status === 'unknown' || allowed ? (
        // `unknown` is the server render and hydration pass - the same neutral
        // box either way, so server HTML and first client render agree.
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/[0.05]">
          <MapPin size={22} className="text-muted-foreground" aria-hidden />
          {allowed && needsTap && (
            <button
              type="button"
              onClick={() => setRequested(true)}
              data-cursor="view"
              className="rounded-full border border-foreground/15 bg-background/70 px-4 py-2 font-sans text-xs text-foreground transition-colors duration-200 hover:border-foreground/40 hover:text-foreground cursor-pointer"
            >
              {loadLabel}
            </button>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/[0.05] px-6 text-center">
          <MapPin size={22} className="text-muted-foreground" aria-hidden />
          <p className="font-sans text-sm font-semibold text-foreground">{dict.consent.mapTitle}</p>
          <p className="max-w-xs font-sans text-xs leading-relaxed text-muted-foreground">{dict.consent.mapText}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setRequested(true)}
              data-cursor="view"
              className="rounded-full bg-foreground px-4 py-2 font-sans text-xs font-semibold text-background transition-colors duration-200 hover:bg-foreground/90 cursor-pointer"
            >
              {dict.consent.loadOnce}
            </button>
            <button
              type="button"
              onClick={allowAlways}
              className="rounded-full border border-foreground/15 bg-background/70 px-4 py-2 font-sans text-xs text-foreground transition-colors duration-200 hover:border-foreground/40 cursor-pointer"
            >
              {dict.consent.alwaysAllow}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
