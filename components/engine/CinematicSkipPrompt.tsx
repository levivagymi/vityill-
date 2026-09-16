'use client'
import { useRef, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CalendarCheck, Play } from 'lucide-react'
import gsap from '@/lib/gsap'
import { useLenis } from '@/components/engine/LenisProvider'
import { useDict } from '@/components/providers/DictProvider'
import { DEV_NOTICE_DISMISSED_EVENT, devNoticeSeen } from '@/components/layout/DevNoticeModal'
import { prefersReducedMotion } from '@/lib/utils'
import { href } from '@/lib/nav'
import { CINEMATIC_PROMPT_SEEN_KEY } from '@/lib/cinematic'
import type { Locale } from '@/lib/types'

const STORAGE_KEY = CINEMATIC_PROMPT_SEEN_KEY

export default function CinematicSkipPrompt({ onSkip }: { onSkip?: () => void }) {
  const dict = useDict()
  const params = useParams()
  const router = useRouter()
  const lang = (params?.lang as Locale) ?? 'hu'
  const [visible, setVisible] = useState(false)
  const overlayRef   = useRef<HTMLDivElement>(null)
  const cardRef      = useRef<HTMLDivElement>(null)
  const watchRef     = useRef<HTMLButtonElement>(null)
  const lenis        = useLenis()
  const dismissedRef = useRef(false)

  // Show 1s after the dev notice is out of the way; skip if already seen
  // this session or if the visitor has already started scrolling.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return
    } catch {
      return
    }

    let timer: ReturnType<typeof setTimeout> | undefined
    const queue = () => {
      timer = setTimeout(() => {
        if (window.scrollY < 40) setVisible(true)
      }, 1000)
    }

    if (devNoticeSeen()) {
      queue()
      return () => clearTimeout(timer)
    }
    window.addEventListener(DEV_NOTICE_DISMISSED_EVENT, queue, { once: true })
    return () => {
      window.removeEventListener(DEV_NOTICE_DISMISSED_EVENT, queue)
      clearTimeout(timer)
    }
  }, [])

  // Unmount cleanup: kill in-flight tweens and ensure Lenis is re-started
  useEffect(() => {
    const card    = cardRef.current
    const overlay = overlayRef.current
    return () => {
      gsap.killTweensOf([card, overlay])
      lenis?.start()
    }
  }, [lenis])

  // Animate in + lock scroll when visible becomes true
  useEffect(() => {
    if (!visible) return
    const overlay = overlayRef.current
    const card    = cardRef.current
    if (!overlay || !card) return

    lenis?.stop()
    watchRef.current?.focus()

    if (prefersReducedMotion()) {
      gsap.set([overlay, card], { opacity: 1 })
      return
    }

    gsap.fromTo(overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power3.out' }
    )
    gsap.fromTo(card,
      { opacity: 0, y: 20, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out', delay: 0.08 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const dismiss = (callback?: () => void) => {
    if (dismissedRef.current) return
    dismissedRef.current = true

    try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }

    gsap.to([cardRef.current, overlayRef.current], {
      opacity: 0,
      duration: prefersReducedMotion() ? 0.01 : 0.4,
      ease: 'power2.in',
      onComplete: () => {
        lenis?.start()
        setVisible(false)
        callback?.()
      },
    })
  }

  const handleWatch = () => dismiss()

  const handleSkip = () => dismiss(onSkip)

  // Booking bypasses the cinematic entirely: it tears down like Skip does,
  // then routes to the booking page once the fade-out completes.
  const handleBook = () => dismiss(() => {
    onSkip?.()
    router.push(href(lang, 'booking'))
  })

  // Escape behaves like "watch": close the prompt, stay at the top.
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  if (!visible) return null

  return (
    <>
      {/* Full-screen blur overlay */}
      <div
        ref={overlayRef}
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9992,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(10, 26, 16, 0.55)',
          opacity: 0,
        }}
      />

      {/* Dead-center card: this prompt is the star of the first screen. */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cinematic-prompt-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9993,
          width: 'calc(100% - 2rem)',
          maxWidth: 420,
          background: '#0a1a10',
          border: '1px solid rgba(255,244,204,0.15)',
          borderRadius: 16,
          padding: '2rem 1.75rem',
          opacity: 0,
        }}
      >
        <p
          id="cinematic-prompt-title"
          className="font-heading text-on-dark-strong text-xl sm:text-2xl leading-snug text-center mb-7"
        >
          {dict.cinematic.skipTitle}
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleBook}
            className="flex items-center justify-center gap-2 py-3 rounded-full border border-[rgba(255,244,204,0.35)] text-on-dark-strong font-sans font-medium text-sm hover:bg-[rgba(255,244,204,0.08)] transition-colors"
          >
            <CalendarCheck size={16} aria-hidden />
            {dict.cinematic.bookBtn}
          </button>
          <button
            ref={watchRef}
            onClick={handleWatch}
            className="flex items-center justify-center gap-2 py-3 rounded-full bg-[#FFF4CC] text-[#1A4731] font-sans font-semibold text-sm hover:scale-[1.03] transition-transform"
          >
            <Play size={16} aria-hidden fill="currentColor" />
            {dict.cinematic.watchBtn}
          </button>
          <button
            onClick={handleSkip}
            className="py-2 text-on-dark-muted font-sans text-xs hover:text-on-dark-strong transition-colors"
          >
            {dict.cinematic.skipBtn}
          </button>
        </div>
      </div>
    </>
  )
}
