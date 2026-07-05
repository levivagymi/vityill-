'use client'
import dynamic from 'next/dynamic'

/**
 * Splits the ~12k-px pinned GSAP narrative (plus its canvas systems) out of
 * the initial bundle. ssr:false is safe here: the section is aria-hidden,
 * purely visual, and the page's real <h1> lives outside it. The placeholder
 * mirrors the section's h-lvh footprint and background so there is no CLS
 * and no flash while the chunk loads.
 */
const CinematicStory = dynamic(() => import('./CinematicStory'), {
  ssr: false,
  loading: () => (
    <div aria-hidden className="h-lvh" style={{ backgroundColor: '#0a1a10' }} />
  ),
})

export default function CinematicStoryLazy() {
  return <CinematicStory />
}
