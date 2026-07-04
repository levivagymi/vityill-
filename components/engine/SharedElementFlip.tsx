'use client'
import { useEffect } from 'react'
import gsap, { Flip } from '@/lib/gsap'
import { consumePendingFlip } from '@/lib/flip-transition'
import { prefersReducedMotion } from '@/lib/utils'
import { EASE } from '@/lib/motion'

/**
 * Destination side of the room-card → room-hero shared-element transition.
 * Mount it on the detail page and point it at the hero image container
 * (PageHero renders `.ph-img`). If no flip was recorded (deep link, reload,
 * reduced motion), it renders nothing and the normal wipe applies.
 */
export default function SharedElementFlip({
  src,
  targetSelector = '.ph-img',
}: {
  src: string
  targetSelector?: string
}) {
  useEffect(() => {
    if (prefersReducedMotion()) {
      consumePendingFlip()
      return
    }
    const rec = consumePendingFlip()
    if (!rec || rec.src !== src) return

    const target = document.querySelector<HTMLElement>(targetSelector)
    if (!target) return

    // Clone flying over the page, ending exactly on the hero.
    const clone = document.createElement('div')
    clone.setAttribute('aria-hidden', 'true')
    Object.assign(clone.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '9997',
      overflow: 'hidden',
      pointerEvents: 'none',
      willChange: 'transform',
      backgroundImage: `url("${rec.src}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    })
    document.body.appendChild(clone)

    // Proxy occupying the source rect lets Flip.fit compute the start pose.
    const proxy = document.createElement('div')
    Object.assign(proxy.style, {
      position: 'fixed',
      top: `${rec.rect.top}px`,
      left: `${rec.rect.left}px`,
      width: `${rec.rect.width}px`,
      height: `${rec.rect.height}px`,
      pointerEvents: 'none',
      visibility: 'hidden',
    })
    document.body.appendChild(proxy)

    const targetRect = target.getBoundingClientRect()
    Object.assign(clone.style, {
      inset: 'auto',
      top: `${targetRect.top}px`,
      left: `${targetRect.left}px`,
      width: `${targetRect.width}px`,
      height: `${targetRect.height}px`,
    })

    Flip.fit(clone, proxy, { scale: true })
    proxy.remove()

    const tl = gsap.timeline({
      onComplete: () => clone.remove(),
    })
    tl.to(clone, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.75,
      ease: EASE.cinematic,
    })
    tl.to(clone, { opacity: 0, duration: 0.3, ease: 'power1.out' }, '-=0.05')

    return () => {
      tl.kill()
      clone.remove()
    }
    // One-shot on mount of the destination page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
