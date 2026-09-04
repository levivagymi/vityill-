'use client'
import { useRef, useEffect } from 'react'
import gsap from '@/lib/gsap'
import { fxFull } from '@/lib/fx'

/** Lightweight scroll-in fade/translate used across subpages. */
export default function Reveal({
  children,
  y = 40,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  y?: number
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Lite mode: .fx-reveal never gets its opacity:0 start state, so the child
    // is already on screen and there is nothing to animate.
    if (!fxFull()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          delay,
          scrollTrigger: { trigger: ref.current, start: 'top 88%' },
        }
      )
    }, ref)
    return () => ctx.revert()
  }, [delay, y])

  return (
    <div ref={ref} className={`fx-reveal ${className}`}>
      {children}
    </div>
  )
}
