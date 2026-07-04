'use client'
import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from '@/lib/gsap'

/**
 * Defers mounting (and therefore chunk-loading, when combined with
 * next/dynamic) of below-the-fold heavy components until the sentinel
 * approaches the viewport. The placeholder reserves height so nothing jumps.
 */
export default function LazyMount({
  children,
  minHeight = 320,
  rootMargin = '400px',
  className,
}: {
  children: React.ReactNode
  minHeight?: number | string
  rootMargin?: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || show) return
    if (typeof IntersectionObserver === 'undefined') {
      // Capability fallback: without IO support, mount immediately.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin, show])

  // The placeholder height is replaced by real content — pinned/scrubbed
  // triggers further down the page must re-measure.
  useEffect(() => {
    if (show) ScrollTrigger.refresh()
  }, [show])

  return (
    <div ref={ref} className={className} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  )
}
