'use client'
import { useDict } from '@/components/providers/DictProvider'
import { scrollToAnchor, useLenis } from '@/components/engine/LenisProvider'

/** Clears the fixed navbar (h-16 / lg:h-20) - same offset the other in-page
 *  jumps use (ScrollProgress, CommandPalette). */
const NAV_OFFSET = -70

/**
 * "Skip to content" (WCAG 2.4.1): the first focusable element on every page,
 * visible only while focused.
 *
 * Every page renders exactly one <main>, but none of them carries an id, so
 * the target is resolved at click time instead. Focus moves first with
 * preventScroll - a native focus scroll and Lenis's own scroll would otherwise
 * fight over the position - then the shared helper jumps there without
 * animating: through Lenis when it is running, natively in lite mode.
 */
export default function SkipLink() {
  const dict = useDict()
  const lenis = useLenis()

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const main = document.querySelector<HTMLElement>('main')
    if (!main) return
    e.preventDefault()
    if (!main.hasAttribute('tabindex')) main.tabIndex = -1
    main.focus({ preventScroll: true })
    scrollToAnchor(lenis, 'main', NAV_OFFSET, true)
  }

  return (
    <a
      href="#main"
      onClick={onClick}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:rounded-full focus:bg-foreground focus:px-5 focus:py-2.5 focus:font-sans focus:text-sm focus:font-semibold focus:text-background focus:shadow-2xl"
    >
      {dict.common.skipToContent}
    </a>
  )
}
