'use client'
import { useEffect, useRef } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import { isDark, rafLoop } from '@/lib/canvas-fx'

// 2D height-field wave equation (finite differences) on a fixed grid; the
// pointer is a force transmitter and scroll depth raises the amplitude.
const GW = 80, GH = 80, DAMP = 0.994

type Grid = { h: Float32Array; hPrev: Float32Array; next: Float32Array }

const makeGrid = (): Grid => ({
  h: new Float32Array(GW * GH),
  hPrev: new Float32Array(GW * GH),
  next: new Float32Array(GW * GH),
})

function stepFluid(g: Grid, c2: number) {
  const { h, hPrev, next } = g
  for (let y = 1; y < GH - 1; y++) {
    for (let x = 1; x < GW - 1; x++) {
      const i = y * GW + x
      next[i] = (2 * h[i] - hPrev[i] + c2 * (h[i - 1] + h[i + 1] + h[i - GW] + h[i + GW] - 4 * h[i])) * DAMP
    }
  }
  hPrev.set(h)
  h.set(next)
}

function splash(g: Grid, fx: number, fy: number, amp: number) {
  const cx = Math.round(fx * GW), cy = Math.round(fy * GH), r = 3
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const nx = cx + dx, ny = cy + dy
      if (nx < 1 || nx >= GW - 1 || ny < 1 || ny >= GH - 1) continue
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d <= r) g.h[ny * GW + nx] += amp * (1 - d / r)
    }
  }
}

export default function JacuzziCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grid = useRef(makeGrid())
  const ampRef = useRef(1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => { ampRef.current = 1 + self.progress * 3 },
    })

    const ambient = setInterval(() => {
      splash(grid.current, Math.random(), Math.random(), 10 * ampRef.current)
    }, 700)

    const onMove = (e: MouseEvent) => {
      splash(grid.current, e.clientX / window.innerWidth, e.clientY / window.innerHeight, 18 * ampRef.current)
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const loop = rafLoop(() => {
      for (let s = 0; s < 3; s++) stepFluid(grid.current, 0.28)
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const dark = isDark()
      const br = dark ? 255 : 26, bg = dark ? 244 : 71, bb = dark ? 204 : 49
      const cw = W / GW, ch = H / GH

      for (let y = 0; y < GH; y++) {
        for (let x = 0; x < GW; x++) {
          const val = grid.current.h[y * GW + x]
          if (Math.abs(val) < 0.3) continue
          const norm = Math.tanh(val / 20)
          const alpha = Math.abs(norm) * 0.4
          const lum = norm > 0 ? 1.2 : 0.7
          ctx.fillStyle = `rgba(${Math.round(br * lum)},${Math.round(bg * lum)},${Math.round(bb * lum)},${alpha.toFixed(3)})`
          ctx.fillRect(x * cw, y * ch, cw + 1, ch + 1)
        }
      }
    })
    loop.start()

    return () => {
      loop.stop()
      clearInterval(ambient)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      st.kill()
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 z-[1]" aria-hidden />
}
