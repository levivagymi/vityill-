'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import Lenis from 'lenis'
import gsap, { ScrollTrigger } from '@/lib/gsap'

const LenisContext = createContext<Lenis | null>(null)

export function useLenis() {
  return useContext(LenisContext)
}

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    })

    const tickerFn = (time: number) => instance.raf(time * 1000)

    instance.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(tickerFn)
    gsap.ticker.lagSmoothing(0)

    // Exposing the freshly-created Lenis instance via context is an external-system
    // subscription — the canonical, allowed use of setState inside an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance)

    return () => {
      instance.destroy()
      gsap.ticker.remove(tickerFn)
    }
  }, [])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
