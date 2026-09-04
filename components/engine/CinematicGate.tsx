'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import CinematicStoryLazy from '@/components/sections/CinematicStoryLazy'
import CinematicSkipPrompt from './CinematicSkipPrompt'
import RewatchCinematicButton from './RewatchCinematicButton'
import { useLenis } from './LenisProvider'
import { ScrollTrigger } from '@/lib/gsap'
import { CINEMATIC_STORAGE_KEY } from '@/lib/cinematic'

type Phase = 'checking' | 'intro' | 'leaving' | 'watched' | 'done'

// The scroll correction below has to land in the same painted frame as the
// unmount, which useEffect (post-paint) can't guarantee - but useLayoutEffect
// warns when it's called through the server renderer, and this component is
// still SSR'd even though it only ever decides anything in the browser.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function CinematicGate() {
  const [phase, setPhase] = useState<Phase>('checking')
  const lenis = useLenis()
  const finishedRef = useRef(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  // Captured immediately before the unmounting setPhase('done'). Restoring a
  // surviving element's viewport offset is what keeps the page still - height
  // arithmetic can't, because GSAP, Lenis and the browser's own clamp all write
  // the scroll position during that same commit.
  const anchorRef = useRef<{ el: HTMLElement; top: number } | null>(null)

  useEffect(() => {
    let watched = false
    try {
      watched = localStorage.getItem(CINEMATIC_STORAGE_KEY) === 'true'
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase(watched ? 'done' : 'intro')
  }, [])

  // Scrolled all the way through: persist the flag and surface the rewatch
  // button. The section deliberately stays mounted at this point - it's still
  // on screen, and its ScrollTrigger spacer still holds the scroll distance the
  // visitor consumed. The teardown waits until they've scrolled clear of it.
  const handleWatchedThrough = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    try { localStorage.setItem(CINEMATIC_STORAGE_KEY, 'true') } catch { /* ignore */ }
    setPhase('watched')
  }, [])

  // Skip only becomes clickable while Lenis is stopped at the very top of the
  // page, so there's no downstream scroll position that removal could strand.
  const handleSkip = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    try { localStorage.setItem(CINEMATIC_STORAGE_KEY, 'true') } catch { /* ignore */ }
    lenis?.start()
    setPhase('leaving')
    window.setTimeout(() => setPhase('done'), 400)
  }, [lenis])

  // Unmount the whole cinematic - pin spacer and all - once it has scrolled
  // entirely above the viewport, leaving a document identical to a returning
  // visitor's. Safe to make final: RewatchCinematicButton reloads the page, so
  // nothing ever re-mounts CinematicStory in place. Waiting for it to clear the
  // viewport first is what makes the teardown invisible - removing ~12800px
  // that's already off-screen shifts everything below up by exactly that much,
  // which the layout effect below cancels back out.
  useEffect(() => {
    if (phase !== 'watched') return
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const io = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1]
      // A positive bottom means it left downward (they scrolled back up into
      // the sequence), which must not tear anything down.
      if (!entry || entry.isIntersecting || entry.boundingClientRect.bottom > 0) return
      io.disconnect()
      // #rolunk is the first section below the removed block, so it survives the
      // unmount and stays a valid reference even while off-screen.
      const anchor = document.getElementById('rolunk')
      anchorRef.current = anchor
        ? { el: anchor, top: anchor.getBoundingClientRect().top }
        : null
      setPhase('done')
    })
    io.observe(wrapper)
    return () => io.disconnect()
  }, [phase])

  useIsomorphicLayoutEffect(() => {
    const anchor = anchorRef.current
    if (phase !== 'done' || !anchor) return

    // GSAP records the scroll before reverting a pin and writes it back at the
    // tail whenever the current position is *lower* than the recorded one -
    // which is exactly what correcting for the removed height looks like. It
    // reads that value from a cache only a real (asynchronous) scroll event
    // invalidates, so it would restore a pre-teardown number and the browser
    // would clamp us to the bottom of the page. Dropping its scroll memory and
    // bumping the cache first is what stops that.
    const restoreAnchor = () => {
      ScrollTrigger.clearScrollMemory()
      ScrollTrigger.update()
      const delta = anchor.el.getBoundingClientRect().top - anchor.top
      if (Math.abs(delta) < 1) return
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      const target = Math.min(Math.max(0, window.scrollY + delta), maxY)
      // Native write first: Lenis's resize() adopts whatever the document is
      // actually scrolled to, so it has to see the corrected value rather than
      // the browser's clamp. scrollTo then no-ops on its own early return.
      window.scrollTo(0, target)
      lenis?.resize()
      lenis?.scrollTo(target, { immediate: true, force: true })
    }

    restoreAnchor()
    // One more pass next frame: Lenis re-adopts the native position on any
    // scroll event it didn't originate, so anything settling late gets caught.
    const raf = requestAnimationFrame(() => {
      restoreAnchor()
      anchorRef.current = null
    })
    return () => cancelAnimationFrame(raf)
  }, [phase, lenis])

  // Every remaining trigger measured itself against the tall document. Passive
  // on purpose: CinematicStory's own teardown (mm.revert(), which kills the
  // pinned trigger) is a useEffect cleanup, so it has already run by this point
  // - refreshing any earlier would re-measure a still-live trigger against a
  // detached element. ScrollProgress in particular caches its start/end pixels
  // per route and never refreshes on its own.
  useEffect(() => {
    if (phase !== 'done' || !finishedRef.current) return
    ScrollTrigger.refresh()
  }, [phase])

  if (phase === 'checking') return null
  if (phase === 'done') return <RewatchCinematicButton />

  return (
    <>
      <CinematicSkipPrompt onSkip={handleSkip} />
      <div
        ref={wrapperRef}
        aria-hidden
        style={{ opacity: phase === 'leaving' ? 0 : 1, transition: 'opacity 0.4s ease' }}
      >
        <CinematicStoryLazy onFinish={handleWatchedThrough} />
      </div>
      {phase === 'watched' && <RewatchCinematicButton />}
    </>
  )
}
