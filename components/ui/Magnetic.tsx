'use client'
import { useEffect, useRef } from 'react'
import gsap from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/utils'

/**
 * Magnetic hover for primary CTAs: the child gently follows the pointer
 * within a capped radius and springs back on leave. Transform-only, inert on
 * coarse pointers and under reduced motion.
 */
export default function Magnetic({
  children,
  strength = 0.35,
  maxShift = 10,
  className,
}: {
  children: React.ReactNode
  strength?: number
  maxShift?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (prefersReducedMotion()) return

    const clamp = gsap.utils.clamp(-maxShift, maxShift)

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      gsap.to(el, {
        x: clamp(dx * strength),
        y: clamp(dy * strength),
        duration: 0.4,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }
    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.45)', overwrite: 'auto' })
    }

    el.addEventListener('mousemove', onMove, { passive: true })
    el.addEventListener('mouseleave', onLeave, { passive: true })
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      gsap.killTweensOf(el)
    }
  }, [strength, maxShift])

  return (
    <div ref={ref} className={className} style={{ display: 'inline-block', willChange: 'transform' }}>
      {children}
    </div>
  )
}
