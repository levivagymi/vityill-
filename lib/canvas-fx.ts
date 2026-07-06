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

// ── Pointer tracker ───────────────────────────────────────────────────────────

export type PointerState = {
  x: number; y: number
  /** Velocity in px/frame, normalized to ~60fps. */
  vx: number; vy: number
  speed: number
  active: boolean
}

/**
 * Window-level pointer tracking for the pointer-events:none scenes. The
 * sticky full-viewport scenes map clientX/Y 1:1 onto their canvases, so no
 * element-space conversion is needed. Call decay() once per frame so gusts
 * fade after the pointer stops moving.
 */
export function trackPointer(): { state: PointerState; decay: () => void; dispose: () => void } {
  const state: PointerState = { x: -1e4, y: -1e4, vx: 0, vy: 0, speed: 0, active: false }
  let lastX = 0, lastY = 0, lastT = 0
  const onMove = (e: PointerEvent) => {
    const t = performance.now()
    if (state.active && lastT) {
      const dt = Math.max(8, t - lastT)
      state.vx = ((e.clientX - lastX) / dt) * 16.7
      state.vy = ((e.clientY - lastY) / dt) * 16.7
      state.speed = Math.hypot(state.vx, state.vy)
    }
    state.x = e.clientX
    state.y = e.clientY
    state.active = true
    lastX = e.clientX; lastY = e.clientY; lastT = t
  }
  const onLeave = () => {
    state.active = false
    state.vx = state.vy = state.speed = 0
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerleave', onLeave)
  window.addEventListener('blur', onLeave)
  return {
    state,
    decay: () => {
      state.vx *= 0.9; state.vy *= 0.9; state.speed *= 0.9
    },
    dispose: () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    },
  }
}

// ── Pointer forces ────────────────────────────────────────────────────────────

/** Particle that remembers its base drift so pointer impulses can decay back. */
export type DrivenParticle = Particle & { bvx: number; bvy: number }

export const drive = (ps: Particle[]): DrivenParticle[] =>
  ps.map((p) => Object.assign(p, { bvx: p.vx, bvy: p.vy }))

export type PointerFx = {
  kind: 'repel' | 'attract' | 'vortex' | 'gust'
  radius: number
  strength: number
}

/**
 * Applies a cursor force field to a driven particle field. Each frame the
 * velocity springs back toward its base drift first, so impulses perturb and
 * settle instead of accumulating without bound.
 */
export function applyPointerForce(ps: DrivenParticle[], m: PointerState, fx: PointerFx) {
  for (const p of ps) {
    p.vx += (p.bvx - p.vx) * 0.08
    p.vy += (p.bvy - p.vy) * 0.08
    if (!m.active) continue
    const dx = p.x - m.x
    const dy = p.y - m.y
    const d2 = dx * dx + dy * dy
    if (d2 >= fx.radius * fx.radius || d2 < 1) continue
    const d = Math.sqrt(d2)
    const f = (1 - d / fx.radius) * fx.strength
    switch (fx.kind) {
      case 'repel':
        p.vx += (dx / d) * f
        p.vy += (dy / d) * f
        break
      case 'attract':
        p.vx -= (dx / d) * f * 0.6
        p.vy -= (dy / d) * f * 0.6
        p.opacity = Math.min(p.maxOpacity, p.opacity + 0.03)
        break
      case 'vortex':
        p.vx += (-dy / d) * f - (dx / d) * f * 0.12
        p.vy += (dx / d) * f - (dy / d) * f * 0.12
        break
      case 'gust':
        p.vx += m.vx * f * 0.15
        p.vy += m.vy * f * 0.15
        break
    }
  }
}

// ── Cursor spark pool ─────────────────────────────────────────────────────────

/** Dormant ring-buffer pool; slots come alive via emitSpark and fade out. */
export function makeSparkPool(cap: number): Particle[] {
  return Array.from({ length: cap }, () => ({
    x: 0, y: 0, r: 0, vx: 0, vy: 0,
    opacity: 0, maxOpacity: 0, phase: 0, wobble: 0,
  }))
}

export type SparkOpts = {
  r: [number, number]
  /** Vertical drift range; negative rises, positive falls. */
  rise: [number, number]
  /** Fraction of the pointer velocity inherited at birth. */
  kick: number
}

export function emitSpark(p: Particle, m: PointerState, opts: SparkOpts) {
  p.x = m.x + (Math.random() - 0.5) * 14
  p.y = m.y + (Math.random() - 0.5) * 14
  p.r = opts.r[0] + Math.random() * (opts.r[1] - opts.r[0])
  p.vx = m.vx * opts.kick + (Math.random() - 0.5) * 1.2
  p.vy = m.vy * opts.kick + opts.rise[0] + Math.random() * (opts.rise[1] - opts.rise[0])
  p.opacity = 0.85 + Math.random() * 0.15
  p.maxOpacity = 1
  p.phase = Math.random() * Math.PI * 2
  p.wobble = 0.3 + Math.random() * 0.5
}

/** Draws & advances a spark pool. Never clears — layer it after an ambient draw. */
export function drawSparks(ctx: CanvasRenderingContext2D, pool: Particle[], t: number, palette: RGB[]) {
  pool.forEach((p, i) => {
    if (p.opacity <= 0.015) return
    p.x += p.vx + Math.sin(t * 0.002 + p.phase) * p.wobble
    p.y += p.vy
    p.vx *= 0.97
    p.opacity -= 0.016
    const [r, g, b] = palette[i % palette.length]
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`; ctx.fill()
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5)
    glow.addColorStop(0, `rgba(${r},${g},${b},${p.opacity * 0.3})`)
    glow.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2)
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
