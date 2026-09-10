'use client'
import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { ScrollTrigger } from '@/lib/gsap'
import { useLenis } from '@/components/engine/LenisProvider'
import { useDict } from '@/components/providers/DictProvider'
import { prefersReducedMotion } from '@/lib/utils'

/**
 * Fixed back-to-top affordance, bottom-right. Visibility is driven by
 * ScrollTrigger rather than a raw scroll listener, so it tracks the same
 * scroll source as ScrollProgress whether or not Lenis is running (lite mode
 * included) instead of duplicating a passive-listener + rAF setup.
 */
export default function ScrollToTopButton() {
  const dict = useDict()
  const lenis = useLenis()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 480,
      end: 'max',
      onToggle: (self) => setVisible(self.isActive),
    })
    return () => st.kill()
  }, [])

  const handleClick = () => {
    const reduced = prefersReducedMotion()
    if (lenis) {
      lenis.scrollTo(0, { immediate: reduced })
      return
    }
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={dict.scrollTop.label}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      data-cursor="view"
      className={`fixed bottom-6 right-4 sm:right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-foreground/10 bg-background/90 backdrop-blur-md text-foreground/70 shadow-lg shadow-black/10 transition-all duration-300 hover:text-foreground hover:bg-background cursor-pointer ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ArrowUp size={24} aria-hidden />
    </button>
  )
}
