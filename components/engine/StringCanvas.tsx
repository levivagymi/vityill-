'use client'
import { useRef, useEffect, type RefObject } from 'react'
import gsap, { ScrollTrigger } from '@/lib/gsap'
import { N, SUBSTEPS, makeString, stepPhysics, pluck, type PhysicsString } from '@/lib/string-physics'
import { STRING_FREQUENCIES, playStringNote, getOrCreateAudioContext } from '@/lib/string-audio'

const STRING_X = [0.15, 0.30, 0.50, 0.70, 0.85] as const
const PROXIMITY_PX = 35
const DRAG_SIGMA_FRAC = 0.10

function tensionToC2(t: number): number { return t * t * 0.45 }

function getForegroundColor(): string {
  return document.documentElement.classList.contains('dark') ? '#FFF4CC' : '#1A4731'
}

function withAlpha(hex: string, alpha: number): string {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, '0')
}

function drawString(
  ctx: CanvasRenderingContext2D,
  s: PhysicsString,
  baseX: number,
  height: number,
  color: string,
  isActive: boolean,
): void {
  const passes = [
    { lineWidth: 18,  alpha: 0.05, shadowBlur: 24 },
    { lineWidth: 7,   alpha: 0.10, shadowBlur: 10 },
    { lineWidth: 1.2, alpha: isActive ? 1.0 : 0.65, shadowBlur: 0 },
  ] as const

  for (const pass of passes) {
    ctx.beginPath()
    ctx.lineWidth = pass.lineWidth
    ctx.lineCap = 'round'
    ctx.shadowBlur = pass.shadowBlur
    ctx.shadowColor = color
    ctx.strokeStyle = withAlpha(color, pass.alpha)
    for (let i = 0; i < N; i++) {
      const x = baseX + s.u[i]
      const y = (i / (N - 1)) * height
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  const dotA = isActive ? 1.0 : 0.6
  ctx.fillStyle = withAlpha(color, dotA)
  ctx.beginPath(); ctx.arc(baseX, 0,      3, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(baseX, height, 3, 0, Math.PI * 2); ctx.fill()
}

export default function StringCanvas({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const strings    = useRef<PhysicsString[]>(STRING_X.map(() => makeString()))
  const tensionRef = useRef(0.40)
  const audioRef   = useRef<AudioContext | null>(null)
  const rafRef     = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const canvas  = canvasRef.current
    const section = sectionRef.current
    if (!canvas || !section) return

    const resize = () => { canvas.width = section.offsetWidth; canvas.height = section.offsetHeight }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(section)

    const st = ScrollTrigger.create({
      trigger: section, start: 'top top', end: 'bottom top',
      onUpdate: (self) => { tensionRef.current = 0.25 + self.progress * 0.60 },
    })

    let mx = -999, my = -999, prevMx = -999, activeIdx = -1

    const findNearest = (cursorX: number): number => {
      let best = PROXIMITY_PX, found = -1
      for (let i = 0; i < STRING_X.length; i++) {
        const d = Math.abs(cursorX - STRING_X[i] * canvas.width)
        if (d < best) { best = d; found = i }
      }
      return found
    }

    const onMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      prevMx = mx; mx = e.clientX - r.left; my = e.clientY - r.top
      activeIdx = findNearest(mx)

      if (activeIdx >= 0) {
        const restX = STRING_X[activeIdx] * canvas.width
        const disp  = mx - restX
        const prox  = 1 - Math.abs(disp) / PROXIMITY_PX
        const yIdx  = Math.max(1, Math.min(N - 2, Math.round((my / canvas.height) * (N - 1))))
        const sig2  = (N * DRAG_SIGMA_FRAC) ** 2
        const vx    = mx - prevMx
        const s     = strings.current[activeIdx]

        for (let j = 1; j < N - 1; j++) {
          const d = j - yIdx
          const w = Math.exp(-(d * d) / (2 * sig2))
          s.u[j]    += (disp * prox * w - s.u[j] * w) * 0.15
          s.uPrev[j] = s.u[j] - vx * w * 0.55
        }
      }
    }

    const onMouseLeave = () => { mx = -999; my = -999; activeIdx = -1 }

    const onClick = (e: MouseEvent) => {
      const r   = canvas.getBoundingClientRect()
      const cx  = e.clientX - r.left
      const cy  = e.clientY - r.top
      const hit = findNearest(cx)
      if (hit < 0) return

      const dist = Math.abs(cx - STRING_X[hit] * canvas.width)
      pluck(strings.current[hit], cy / canvas.height, 18 * (1 - dist / PROXIMITY_PX))

      const ac = getOrCreateAudioContext(audioRef)
      playStringNote(ac, STRING_FREQUENCIES[hit], tensionRef.current, STRING_X[hit] * 2 - 1)
    }

    section.addEventListener('mousemove', onMouseMove)
    section.addEventListener('mouseleave', onMouseLeave)
    section.addEventListener('click', onClick)

    const ctx2d = canvas.getContext('2d')!

    const loop = () => {
      const W = canvas.width, H = canvas.height
      ctx2d.clearRect(0, 0, W, H)
      const c2 = tensionToC2(tensionRef.current)
      for (let sub = 0; sub < SUBSTEPS; sub++) {
        for (const s of strings.current) stepPhysics(s, c2)
      }
      const color = getForegroundColor()
      for (let i = 0; i < strings.current.length; i++) {
        drawString(ctx2d, strings.current[i], STRING_X[i] * W, H, color, i === activeIdx)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      section.removeEventListener('mousemove', onMouseMove)
      section.removeEventListener('mouseleave', onMouseLeave)
      section.removeEventListener('click', onClick)
      st.kill(); ro.disconnect(); audioRef.current?.close()
    }
  }, [sectionRef])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[5]"
      style={{ pointerEvents: 'none' }}
      aria-hidden
    />
  )
}
