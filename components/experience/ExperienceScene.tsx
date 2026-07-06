'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { allowAmbientMotion } from '@/lib/utils'
import type { ExperienceSlug } from '@/lib/nav'
import type { ParallaxVariant } from './ParallaxScene'

// Each scene ships as its own client-only chunk — none of them belong in the
// initial bundle, and none of them can render on the server anyway.
const JacuzziCanvas = dynamic(() => import('./JacuzziCanvas'), { ssr: false })
const SaunaScene = dynamic(() => import('./SaunaScene'), { ssr: false })
const BogracCanvas = dynamic(() => import('./BogracCanvas'), { ssr: false })
const ParallaxScene = dynamic(() => import('./ParallaxScene'), { ssr: false })

/** The parallax variants share one chunk; each slug gets a stable wrapper. */
function parallax(variant: ParallaxVariant): React.ComponentType {
  return function ParallaxVariantScene() {
    return <ParallaxScene variant={variant} />
  }
}

const SCENES: Record<ExperienceSlug, React.ComponentType> = {
  jacuzzi: JacuzziCanvas,
  sauna: SaunaScene,
  bograc: BogracCanvas,
  erdo: parallax('erdo'),
  vilagitas: parallax('vilagitas'),
  kilatas: parallax('kilatas'),
  klima: parallax('klima'),
  tv: parallax('tv'),
  konyha: parallax('konyha'),
}

/**
 * Mounts the live canvas scene only when the visitor allows ambient motion
 * (no reduced-motion, no save-data). Everyone else — including the first
 * SSR paint — gets a graded still of the same experience, so the page reads
 * identically with zero RAF cost.
 */
export default function ExperienceScene({
  slug,
  fallbackImage,
  fallbackAlt,
}: {
  slug: ExperienceSlug
  fallbackImage: string
  fallbackAlt: string
}) {
  const [live, setLive] = useState(false)

  useEffect(() => {
    // One-time hydration of a browser-only media-query/save-data check.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLive(allowAmbientMotion())
  }, [])

  const Scene = SCENES[slug]

  return (
    <>
      <div className="absolute inset-0 z-0" aria-hidden>
        <Image
          src={fallbackImage}
          alt={fallbackAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
          style={live ? { opacity: 0.35, filter: 'saturate(0.7)' } : undefined}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'color-mix(in oklab, var(--background) 55%, transparent)' }}
        />
      </div>
      {live && <Scene />}
    </>
  )
}
