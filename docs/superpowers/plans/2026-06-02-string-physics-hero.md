# String Physics Hero — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a spring-mass-damper interactive string physics simulation as a canvas overlay on the Hero section, with Web Audio API resonance and GSAP scroll-driven tension.

**Architecture:** Five vertical "strings" span the full hero viewport rendered on an HTML5 `<canvas>`. Physics run via the finite-difference wave equation (velocity-Verlet scheme) with 3 substeps per frame for stability. The cursor drags strings as it passes through them; releasing injects velocity to produce a realistic pluck. Audio plays a pentatonic note per string via the Web Audio API. Scroll progress linearly maps to wave speed (tension).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, GSAP + ScrollTrigger (already registered in `lib/gsap.ts`), Web Audio API, HTML5 Canvas 2D, Tailwind v4 CSS variables for theme-aware colors.

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `lib/string-physics.ts` | **Create** | Pure physics — types, `makeString`, `stepPhysics`, `pluck` |
| `lib/string-audio.ts` | **Create** | Pure Web Audio — `playStringNote`, note frequencies |
| `components/engine/StringCanvas.tsx` | **Create** | Canvas component — RAF loop, mouse events, GSAP tension, rendering |
| `components/sections/Hero.tsx` | **Modify** | Add `<StringCanvas sectionRef={sectionRef} />` |

---

## Task 1: Pure Physics Engine (`lib/string-physics.ts`)

**Files:**
- Create: `lib/string-physics.ts`

- [ ] **Step 1: Write the physics module**

```typescript
// lib/string-physics.ts
export const N = 128
export const SUBSTEPS = 3
export const DAMPING = 0.9992

export interface PhysicsString {
  u: Float32Array
  uPrev: Float32Array
}

export function makeString(): PhysicsString {
  return { u: new Float32Array(N), uPrev: new Float32Array(N) }
}

/**
 * Advance one physics substep via finite-difference wave equation:
 *   u[i][t+1] = (2u[i][t] - u[i][t-1] + c²(u[i-1] - 2u[i] + u[i+1])) * damping
 * Stability requires c2 < 1.0 per substep.
 */
export function stepPhysics(s: PhysicsString, c2: number): void {
  const { u, uPrev } = s
  const next = new Float32Array(N)
  for (let i = 1; i < N - 1; i++) {
    next[i] = (2 * u[i] - uPrev[i] + c2 * (u[i - 1] - 2 * u[i] + u[i + 1])) * DAMPING
  }
  next[0] = 0; next[N - 1] = 0
  uPrev.set(u)
  u.set(next)
}

/**
 * Displace string at fractional y-position using a Gaussian pulse.
 * @param yFrac  [0, 1] — 0 = top, 1 = bottom
 * @param amplitude  peak displacement in pixels
 */
export function pluck(s: PhysicsString, yFrac: number, amplitude: number): void {
  const center = Math.round(yFrac * (N - 1))
  const sigma2 = (N * 0.09) ** 2
  for (let i = 1; i < N - 1; i++) {
    const d = i - center
    s.u[i] += amplitude * Math.exp(-(d * d) / (2 * sigma2))
  }
}

export function maxAmplitude(s: PhysicsString): number {
  let max = 0
  for (let i = 0; i < N; i++) { const a = Math.abs(s.u[i]); if (a > max) max = a }
  return max
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/string-physics.ts
git commit -m "feat: add spring-mass-damper string physics engine"
```

---

## Task 2: Web Audio Module (`lib/string-audio.ts`)

**Files:**
- Create: `lib/string-audio.ts`

- [ ] **Step 1: Write the audio module**

```typescript
// lib/string-audio.ts
// C4 major pentatonic: C4 D4 E4 G4 A4
export const STRING_FREQUENCIES = [261.63, 293.66, 329.63, 392.00, 440.00] as const

/**
 * Play a pluck note — triangle wave primary + sine octave harmonic.
 * @param tension  [0, 1] — scales pitch by ±30% for scroll-driven pitch bend
 * @param pan      [-1, 1] — stereo position
 */
export function playStringNote(
  ctx: AudioContext,
  baseHz: number,
  tension: number,
  pan: number,
): void {
  const freq = baseHz * (0.85 + tension * 0.30)

  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  const gain2 = ctx.createGain()
  const panner = ctx.createStereoPanner()

  osc1.type = 'triangle'; osc1.frequency.value = freq
  osc2.type = 'sine'; osc2.frequency.value = freq * 2.01
  gain2.gain.value = 0.10

  const now = ctx.currentTime
  gain1.gain.setValueAtTime(0, now)
  gain1.gain.linearRampToValueAtTime(0.22, now + 0.006)
  gain1.gain.exponentialRampToValueAtTime(0.10, now + 0.25)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 4.5)

  panner.pan.value = Math.max(-0.85, Math.min(0.85, pan))

  osc1.connect(gain1); gain1.connect(panner)
  osc2.connect(gain2); gain2.connect(panner)
  panner.connect(ctx.destination)

  osc1.start(now); osc2.start(now)
  osc1.stop(now + 5); osc2.stop(now + 5)
}

export function getOrCreateAudioContext(ref: { current: AudioContext | null }): AudioContext {
  if (!ref.current) ref.current = new AudioContext()
  if (ref.current.state === 'suspended') ref.current.resume()
  return ref.current
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/string-audio.ts
git commit -m "feat: add Web Audio pentatonic string note playback"
```

---

## Task 3: StringCanvas Component

**Files:**
- Create: `components/engine/StringCanvas.tsx`

**Rendering passes per string:**
1. lineWidth=18, alpha=0.05, shadowBlur=24 — outer aura
2. lineWidth=7, alpha=0.10, shadowBlur=10 — mid glow
3. lineWidth=1.2, alpha=0.65 (1.0 if active) — the string itself

**Drag-pluck model:** `onMouseMove` computes `displacement = cursorX - stringRestX`, blends it into `u[i]` with a Gaussian weight, and writes cursor horizontal velocity into `uPrev[i]`. This bakes velocity into the Verlet integrator so releasing the cursor causes the string to snap back with realistic physics.

- [ ] **Step 1: Write the component**

```typescript
// components/engine/StringCanvas.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/engine/StringCanvas.tsx
git commit -m "feat: StringCanvas — wave physics, drag-pluck interaction, Web Audio, GSAP tension"
```

---

## Task 4: Hero Integration

**Files:**
- Modify: `components/sections/Hero.tsx`

- [ ] **Step 1: Add import**

At the top of `components/sections/Hero.tsx`, after the existing imports, add:
```typescript
import StringCanvas from '@/components/engine/StringCanvas'
```

- [ ] **Step 2: Render StringCanvas**

Inside the `<section>` element, between the last gradient `div` and `<div ref={contentRef} ...>`, add:
```tsx
{/* Phase 2 — interactive string physics canvas */}
<StringCanvas sectionRef={sectionRef} />
```

Final section child order:
1. `imageRef` div — background photo
2. `overlayRef` div — dark opacity overlay
3. gradient `div` — `from-background/30 ... to-background/70`
4. `<StringCanvas sectionRef={sectionRef} />` ← z-[5], pointer-events: none
5. `contentRef` div — text + CTA, z-10
6. scroll indicator button

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: TypeScript clean, all 3 locale routes generated.

- [ ] **Step 4: Visual QA**

Start dev server (`npm run dev`), open `http://localhost:3000/hu`.

- [ ] 5 vertical glowing strings visible spanning full hero height
- [ ] Moving cursor through a string causes it to bend toward cursor
- [ ] Releasing cursor quickly causes string to vibrate and decay
- [ ] Clicking near a string triggers Gaussian pluck + musical note
- [ ] 5 strings play different pentatonic notes (left=C4, right=A4)
- [ ] Scrolling down → strings vibrate faster, clicked notes pitch up
- [ ] Dark mode: cream strings on green bg. Light mode: green strings on cream bg
- [ ] Touch device: canvas not rendered, no errors

- [ ] **Step 5: Commit**

```bash
git add components/sections/Hero.tsx
git commit -m "feat: Phase 2 complete — string physics hero"
```

---

## Spec Coverage Audit

| Requirement (prompt.md) | Covered by |
|---|---|
| Spring-mass-damper physics | Task 1 — `stepPhysics` wave equation + `DAMPING` |
| Pluck, vibrate, decay | Task 1 — `pluck()` + Verlet integration + 0.9992 damping |
| Cursor passes over → string reacts | Task 3 — `onMouseMove` drag model with uPrev velocity |
| Audio-visual resonance, pentatonic notes | Task 2 + Task 3 onClick |
| Scroll-driven tension | Task 3 — `ScrollTrigger` → `tensionRef` → `tensionToC2()` |
| Strings span full viewport | Task 3 — canvas `absolute inset-0`, draws y=0→H |
| Theme-aware colors | Task 3 — `getForegroundColor()` reads `.dark` class |
| Touch device graceful skip | Task 3 — `pointer: coarse` guard |
| Custom cursor `pluck` state | **Partial** — cursor doesn't morph to pluck state (canvas events bypass DOM cursor scanning). Optional fix documented at end of plan. |

**Optional cursor fix** — add to `app/[lang]/layout.tsx` inside `<LenisProvider>`:
```tsx
<div id="string-cursor-sentinel" data-cursor="pluck" className="sr-only" aria-hidden />
```
And in `StringCanvas` `onMouseMove`, after finding `activeIdx`:
```typescript
const sentinel = document.getElementById('string-cursor-sentinel')
if (sentinel) {
  const event = activeIdx >= 0 ? 'mouseenter' : 'mouseleave'
  sentinel.dispatchEvent(new MouseEvent(event, { bubbles: false }))
}
```
