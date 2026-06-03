'use client'
import { useRef, useEffect, useState } from 'react'
import gsap from '@/lib/gsap'
import { useLenis } from '@/components/engine/LenisProvider'

export default function CinematicSkipPrompt() {
  const [visible, setVisible] = useState(false)
  const overlayRef   = useRef<HTMLDivElement>(null)
  const cardRef      = useRef<HTMLDivElement>(null)
  const lenis        = useLenis()
  const dismissedRef = useRef(false)

  // Show after 1s; skip if already seen this session
  useEffect(() => {
    if (sessionStorage.getItem('cinematic-prompt-seen')) return
    const timer = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(timer)
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

    gsap.fromTo(overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power3.out' }
    )
    gsap.fromTo(card,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.08 }
    )
  }, [visible, lenis])

  const dismiss = (callback?: () => void) => {
    if (dismissedRef.current) return
    dismissedRef.current = true

    sessionStorage.setItem('cinematic-prompt-seen', '1')

    gsap.to([cardRef.current, overlayRef.current], {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        lenis?.start()
        setVisible(false)
        callback?.()
      },
    })
  }

  const handleWatch = () => dismiss()

  const handleSkip = () =>
    dismiss(() => {
      const about = document.getElementById('about')
      if (about) lenis?.scrollTo(about)
    })

  if (!visible) return null

  return (
    <>
      {/* Full-screen blur overlay */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(10, 26, 16, 0.55)',
        }}
      />

      {/* Bottom-center card */}
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: 'calc(100% - 2rem)',
          maxWidth: 400,
          background: '#0a1a10',
          border: '1px solid rgba(255,244,204,0.15)',
          borderRadius: 14,
          padding: '1.5rem',
        }}
      >
        <p className="font-heading text-[#FFF4CC] text-lg leading-snug mb-1">
          Egy filmszerű élmény vár rád
        </p>
        <p className="font-sans text-[rgba(255,244,204,0.5)] text-xs leading-relaxed mb-5">
          Görgetéssel irányítod a történetet — vagy átugorhatod.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-2.5 rounded-full border border-[rgba(255,244,204,0.35)] text-[rgba(255,244,204,0.6)] font-sans text-sm hover:bg-[rgba(255,244,204,0.08)] transition-colors"
          >
            Átugrás
          </button>
          <button
            onClick={handleWatch}
            className="flex-1 py-2.5 rounded-full bg-[#FFF4CC] text-[#1A4731] font-sans font-semibold text-sm hover:scale-[1.03] transition-transform"
          >
            Nézem →
          </button>
        </div>
      </div>
    </>
  )
}
