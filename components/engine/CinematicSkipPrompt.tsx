'use client'
import { useRef, useEffect, useState } from 'react'
import gsap from '@/lib/gsap'
import { useLenis } from '@/components/engine/LenisProvider'
import { useDict } from '@/components/providers/DictProvider'
import { DEV_NOTICE_DISMISSED_EVENT, devNoticeSeen } from '@/components/layout/DevNoticeModal'
import { prefersReducedMotion } from '@/lib/utils'

const STORAGE_KEY = 'cinematic-prompt-seen'

export default function CinematicSkipPrompt({ onSkip }: { onSkip?: () => void }) {
  const dict = useDict()
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
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.08 }
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

      {/* Bottom-center card */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cinematic-prompt-title"
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9993,
          width: 'calc(100% - 2rem)',
          maxWidth: 400,
          background: '#0a1a10',
          border: '1px solid rgba(255,244,204,0.15)',
          borderRadius: 14,
          padding: '1.5rem',
          opacity: 0,
        }}
      >
        <p id="cinematic-prompt-title" className="font-heading text-[#FFF4CC] text-lg leading-snug mb-1">
          {dict.cinematic.skipTitle}
        </p>
        <p className="font-sans text-[rgba(255,244,204,0.5)] text-xs leading-relaxed mb-5">
          {dict.cinematic.skipText}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-2.5 rounded-full border border-[rgba(255,244,204,0.35)] text-[rgba(255,244,204,0.6)] font-sans text-sm hover:bg-[rgba(255,244,204,0.08)] transition-colors"
          >
            {dict.cinematic.skipBtn}
          </button>
          <button
            ref={watchRef}
            onClick={handleWatch}
            className="flex-1 py-2.5 rounded-full bg-[#FFF4CC] text-[#1A4731] font-sans font-semibold text-sm hover:scale-[1.03] transition-transform"
          >
            {dict.cinematic.watchBtn}
          </button>
        </div>
      </div>
    </>
  )
}
