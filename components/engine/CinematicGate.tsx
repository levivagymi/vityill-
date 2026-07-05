'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import CinematicStoryLazy from '@/components/sections/CinematicStoryLazy'
import CinematicSkipPrompt from './CinematicSkipPrompt'
import RewatchCinematicButton from './RewatchCinematicButton'
import { useLenis } from './LenisProvider'
import { CINEMATIC_STORAGE_KEY } from '@/lib/cinematic'

type Phase = 'checking' | 'intro' | 'leaving' | 'watched' | 'done'

export default function CinematicGate() {
  const [phase, setPhase] = useState<Phase>('checking')
  const lenis = useLenis()
  const finishedRef = useRef(false)

  useEffect(() => {
    let watched = false
    try {
      watched = localStorage.getItem(CINEMATIC_STORAGE_KEY) === 'true'
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase(watched ? 'done' : 'intro')
  }, [])

  // Scrolled all the way through: persist the flag and surface the rewatch
  // button. The pinned section stays mounted — its ScrollTrigger spacer holds
  // the scroll distance the visitor already consumed, and tearing it down now
  // (after they've scrolled past it) would collapse that space out from under
  // their current scroll position and yank them down the page. The flag hides
  // it for good on the next load instead.
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

  if (phase === 'checking') return null
  if (phase === 'done') return <RewatchCinematicButton />

  return (
    <>
      <CinematicSkipPrompt onSkip={handleSkip} />
      <div aria-hidden style={{ opacity: phase === 'leaving' ? 0 : 1, transition: 'opacity 0.4s ease' }}>
        <CinematicStoryLazy onFinish={handleWatchedThrough} />
      </div>
      {phase === 'watched' && <RewatchCinematicButton />}
    </>
  )
}
