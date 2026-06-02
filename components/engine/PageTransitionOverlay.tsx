'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import gsap, { ScrollTrigger } from '@/lib/gsap'
import { useLenis } from './LenisProvider'

export default function PageTransitionOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const lenis = useLenis()
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    ScrollTrigger.getAll().forEach((t) => t.kill())
    lenis?.scrollTo(0, { immediate: true })

    if (tweenRef.current) tweenRef.current.kill()

    gsap.set(overlay, { clipPath: 'inset(0 0 0% 0)' })

    tweenRef.current = gsap.to(overlay, {
      clipPath: 'inset(100% 0 0% 0)',
      duration: 0.9,
      ease: 'power4.inOut',
      delay: 0.05,
      onComplete: () => {
        gsap.set(overlay, { clipPath: 'inset(0 0 100% 0)' })
      },
    })

    return () => {
      tweenRef.current?.kill()
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={overlayRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        backgroundColor: '#1A4731',
        pointerEvents: 'none',
        clipPath: 'inset(0 0 100% 0)',
        willChange: 'clip-path',
      }}
    />
  )
}
