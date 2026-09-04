'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { fxFull } from '@/lib/fx'

/**
 * Gate for the two pointer-driven decorations. Both run a gsap.ticker callback
 * for the entire life of the page, so they are worth more than their bundle
 * size on a slow CPU — and neither has anything to do on a touch screen.
 *
 * Loading them through next/dynamic keeps their code out of the layout chunk
 * entirely: a phone, or a machine in lite mode, never downloads either.
 * globals.css hides the native cursor under the same `data-fx="full"` +
 * `(pointer: fine)` conditions, so the two can never disagree and leave a
 * visitor with no cursor at all.
 */
const CustomCursor = dynamic(() => import('./CustomCursor'), { ssr: false })
const AmbientGlow = dynamic(() => import('./AmbientGlow'), { ssr: false })

export default function PointerFx() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!fxFull()) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    // Capability probe against the live DOM/matchMedia — only knowable here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(true)
  }, [])

  if (!enabled) return null

  return (
    <>
      <CustomCursor />
      <AmbientGlow />
    </>
  )
}
