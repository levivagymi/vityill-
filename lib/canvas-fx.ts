/**
 * Shared canvas particle physics. Extracted from CinematicStory so the
 * cinematic hero and the experience subpage scenes animate from one source
 * of truth. Everything here is plain 2D-canvas math — no React, no GSAP.
 */

export type Particle = {
  x: number; y: number; r: number
  vx: number; vy: number
  opacity: number; maxOpacity: number
  phase: number; wobble: number
}

export type RGB = [number, number, number]

/** Theme probe used by per-frame canvas colors (mirrors ThemeProvider). */
export const isDark = (): boolean =>
  document.documentElement.classList.contains('dark')

// ── Steam ─────────────────────────────────────────────────────────────────────

export const STEAM_COLOR: RGB = [210, 235, 255]

export function makeSteam(w: number, h: number, count = 60): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: h - Math.random() * h * 0.3,
    r: 3 + Math.random() * 8,
    vx: (Math.random() - 0.5) * 0.6,
    vy: -(0.5 + Math.random() * 1.5),
    opacity: 0.05 + Math.random() * 0.35,
    maxOpacity: 0.1 + Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
    wobble: 0.4 + Math.random() * 0.8,
  }))
}

export function drawSteam(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ps: Particle[],
  t: number,
  rgb: RGB = STEAM_COLOR,
) {
  ctx.clearRect(0, 0, w, h)
  const [r, g, b] = rgb
  for (const p of ps) {
    p.x += p.vx + Math.sin(t * 0.0007 + p.phase) * p.wobble
    p.y += p.vy
    p.opacity -= 0.0012
    if (p.y < -30 || p.opacity < 0) {
      p.x = Math.random() * w; p.y = h + 10; p.opacity = p.maxOpacity
    }
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
    grad.addColorStop(0, `rgba(${r},${g},${b},${p.opacity})`)
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = grad; ctx.fill()
  }
}

// ── Embers ────────────────────────────────────────────────────────────────────

/** Fire palette: hot orange → amber → deep red. */
export const EC: RGB[] = [[255,160,0],[255,100,0],[255,210,50],[220,80,10],[255,170,0]]

export function makeEmbers(w: number, h: number, count = 80): Particle[] {
  return Array.from({ length: count }, () => ({
    x: w * 0.3 + Math.random() * w * 0.4,
    y: h * 0.55 + Math.random() * h * 0.45,
    r: 1.5 + Math.random() * 4,
    vx: (Math.random() - 0.5) * 1.8,
    vy: -(1.2 + Math.random() * 3.5),
    opacity: 0.4 + Math.random() * 0.6,
    maxOpacity: 0.5 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    wobble: 1 + Math.random() * 2.5,
  }))
}

export function drawEmbers(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ps: Particle[],
  t: number,
  palette: RGB[] = EC,
) {
  ctx.clearRect(0, 0, w, h)
  ps.forEach((p, i) => {
    p.x  += p.vx + Math.sin(t * 0.001 + p.phase) * p.wobble
    p.y  += p.vy
    p.opacity = Math.max(0.05, Math.min(p.maxOpacity, p.opacity + (Math.random() - 0.5) * 0.1))
    if (p.y < -15) {
      p.x = w * 0.3 + Math.random() * w * 0.4
      p.y = h * 0.6 + Math.random() * h * 0.35
      p.opacity = p.maxOpacity
    }
    const [r, g, b] = palette[i % palette.length]
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`; ctx.fill()
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
    glow.addColorStop(0, `rgba(${r},${g},${b},${p.opacity * 0.25})`)
    glow.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
    ctx.fillStyle = glow; ctx.fill()
  })
}

// ── RAF loop guard ────────────────────────────────────────────────────────────

export type RafLoop = { start: () => void; stop: () => void; running: () => boolean }

/**
 * Idempotent requestAnimationFrame loop. Scrub-driven timelines re-fire
 * onStart/onReverseComplete callbacks, and a second naive start would spawn a
 * parallel loop that can never be cancelled — this guard makes start/stop safe
 * to call any number of times, in any order.
 */
export function rafLoop(draw: (t: number) => void): RafLoop {
  let id = 0
  let on = false
  const tick = (t: number) => {
    if (!on) return
    draw(t)
    id = requestAnimationFrame(tick)
  }
  return {
    start: () => {
      if (on) return
      on = true
      id = requestAnimationFrame(tick)
    },
    stop: () => {
      on = false
      cancelAnimationFrame(id)
    },
    running: () => on,
  }
}
