'use client'
import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { fxFull } from '@/lib/fx'

/** The Google Maps embed for Szomód, Szőlősor dűlő 119. */
const MAP_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4141.433965054247!2d18.325239263444374!3d47.696310253120345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x476a4f3c8d51135d%3A0xb90cf9714fdda3b!2zVml0eWlsbMOzIFZlbmTDqWdow6F6!5e0!3m2!1shu!2shu!4v1788459810620!5m2!1shu!2shu'

/**
 * The map embed pulls in well over a megabyte of third-party script and tiles —
 * more than the rest of the homepage put together — for a decorative panel
 * halfway down the page. Two guards:
 *
 *   full mode — mounted by IntersectionObserver, so it is only requested when
 *     the panel is genuinely approaching the viewport. (`loading="lazy"` alone
 *     is not enough: the browser's own threshold is generous, and on a fast
 *     connection it fetches the embed while the visitor is still in the hero.)
 *   lite mode — never fetched without an explicit tap. The placeholder keeps
 *     the panel's box, so the swap costs no layout shift either way.
 */
export default function LocationMap({ title, loadLabel }: { title: string; loadLabel: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  const [needsTap, setNeedsTap] = useState(false)

  useEffect(() => {
    if (!fxFull()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNeedsTap(true)
      return
    }
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShow(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin: '150px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

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
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/[0.05]">
          <MapPin size={22} className="text-foreground/35" aria-hidden />
          {needsTap && (
            <button
              type="button"
              onClick={() => setShow(true)}
              data-cursor="view"
              className="rounded-full border border-foreground/15 bg-background/70 px-4 py-2 font-sans text-xs text-foreground/70 transition-colors duration-200 hover:border-foreground/40 hover:text-foreground cursor-pointer"
            >
              {loadLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
