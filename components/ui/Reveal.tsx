'use client'
import { useRef, useEffect } from 'react'
import gsap from '@/lib/gsap'

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
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  )
}
