# Phase 3 — Immersive Subpages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three immersive experience subpages — Jacuzzi (2D fluid wave canvas), Sauna (SVG heat-haze + steam particles), Bogrács (ember particle engine) — each at `/[lang]/{slug}` with full environmental canvas, theme-aware colors, and scroll-driven intensity.

**Architecture:** Each subpage is a Next.js App Router route under `app/[lang]/`. A shared `SubpageShell` component provides Navbar replacement, translucent content overlay, and back link. Each canvas component is a standalone `'use client'` component using `requestAnimationFrame` and GSAP ScrollTrigger for scroll-driven effects. Dict entries for all three pages are added to the three language JSON files. No new dependencies required — all effects use Canvas 2D, SVG filters, and the already-installed GSAP.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, GSAP + ScrollTrigger (`lib/gsap.ts`), HTML5 Canvas 2D, SVG `feTurbulence`/`feDisplacementMap`, Tailwind v4 CSS variables (`#1A4731` forest green, `#FFF4CC` warm cream).

---

## Design Tokens

```
Dark bg:  #1A4731    Light bg: #FFF4CC
isDark(): document.documentElement.classList.contains('dark')
Foreground dark  → '#FFF4CC'
Foreground light → '#1A4731'
```

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `dictionaries/hu.json` | Modify | Add `experiences.jacuzzi/sauna/bograc` |
| `dictionaries/en.json` | Modify | Same in English |
| `dictionaries/de.json` | Modify | Same in German |
| `components/experience/SubpageShell.tsx` | Create | Shared layout: logo, back link, content card |
| `components/experience/JacuzziCanvas.tsx` | Create | 2D wave height-field fluid sim |
| `components/experience/SaunaScene.tsx` | Create | Steam particles + SVG feTurbulence |
| `components/experience/BogracCanvas.tsx` | Create | Ember particle engine |
| `app/[lang]/jacuzzi/page.tsx` | Create | `/[lang]/jacuzzi` route |
| `app/[lang]/sauna/page.tsx` | Create | `/[lang]/sauna` route |
| `app/[lang]/bograc/page.tsx` | Create | `/[lang]/bograc` route |
| `components/sections/Amenities.tsx` | Modify | Add "Explore →" links on sauna/pool/grill cards |

---

## GateGuard Note

State these facts before **every** Write or Edit tool call:
1. File(s) that will import the new file
2. No existing file serves this purpose
3. No data files read/written
4. User instruction: *"phase 3"*

---

## Task 1: Dictionary Entries

**Files:** Modify `dictionaries/hu.json`, `dictionaries/en.json`, `dictionaries/de.json`

- [ ] **Step 1: Add to `dictionaries/hu.json`** (before the closing `}`)

```json
,
  "experiences": {
    "back": "← Vissza a főoldalra",
    "bookCta": "Foglaljon most",
    "jacuzzi": {
      "eyebrow": "Vízi élmény",
      "title": "Jacuzzi & Medence",
      "desc": "Merüljön el a meleg vízben a Gerecse panorámájával.",
      "detail": "Privát kültéri medence és pezsgőfürdő, körülvéve a Gerecse-hegység festői erdejével. Kezelhető hőmérséklet, teljes privát használat."
    },
    "sauna": {
      "eyebrow": "Termál élmény",
      "title": "Finn Szauna",
      "desc": "Hagyományos finn szauna melegségével lazítson el.",
      "detail": "Hagyományos finn szauna teljes privát használattal. A magas hő és a természetes páratartalom mélyrehatóan felfrissíti a testet és a lelket."
    },
    "bograc": {
      "eyebrow": "Tűz & Ízek",
      "title": "Bográcsos Főzés",
      "desc": "Nyílt tűz felett rotyogó bogrács — a tökéletes esti összejövetel.",
      "detail": "Felszerelt kültéri bográcsos grillhely, ahol a tűz körüli főzés élménye összeköti a vendégeket a természettel."
    }
  }
```

- [ ] **Step 2: Add to `dictionaries/en.json`** (before the closing `}`)

```json
,
  "experiences": {
    "back": "← Back to home",
    "bookCta": "Book Now",
    "jacuzzi": {
      "eyebrow": "Aquatic Experience",
      "title": "Jacuzzi & Pool",
      "desc": "Sink into warm water with panoramic views of the Gerecse hills.",
      "detail": "Temperature-controlled private outdoor pool and hot tub, surrounded by the scenic forests of the Gerecse hills. Full private access."
    },
    "sauna": {
      "eyebrow": "Thermal Experience",
      "title": "Finnish Sauna",
      "desc": "Unwind with the traditional warmth of a Finnish sauna.",
      "detail": "Traditional Finnish sauna for exclusive private use. The high heat and natural humidity deeply rejuvenate body and mind."
    },
    "bograc": {
      "eyebrow": "Fire & Flavour",
      "title": "Open-Fire Cooking",
      "desc": "A bubbling kettle over open flames — the perfect evening gathering.",
      "detail": "Equipped outdoor kettle grill area where cooking over fire connects guests with nature and each other."
    }
  }
```

- [ ] **Step 3: Add to `dictionaries/de.json`** (before the closing `}`)

```json
,
  "experiences": {
    "back": "← Zurück zur Startseite",
    "bookCta": "Jetzt buchen",
    "jacuzzi": {
      "eyebrow": "Wasser-Erlebnis",
      "title": "Jacuzzi & Pool",
      "desc": "Tauchen Sie ein in warmes Wasser mit Panoramablick auf die Gerecse-Hügel.",
      "detail": "Temperaturgesteuerter privater Außenpool und Whirlpool, umgeben von den Wäldern der Gerecse-Hügel. Volle Privatnutzung."
    },
    "sauna": {
      "eyebrow": "Thermal-Erlebnis",
      "title": "Finnische Sauna",
      "desc": "Entspannen Sie mit der Wärme einer finnischen Sauna.",
      "detail": "Traditionelle finnische Sauna zur exklusiven Privatnutzung. Hohe Wärme und natürliche Feuchtigkeit regenerieren Körper und Geist."
    },
    "bograc": {
      "eyebrow": "Feuer & Geschmack",
      "title": "Lagerfeuer-Kochen",
      "desc": "Ein Kessel über offenem Feuer — das perfekte Abendtreffen.",
      "detail": "Ausgestatteter Außen-Kessel-Grillplatz, wo Kochen über Feuer die Gäste mit der Natur verbindet."
    }
  }
```

- [ ] **Step 4: Validate JSON**

```bash
node -e "require('./dictionaries/hu.json'); require('./dictionaries/en.json'); require('./dictionaries/de.json'); console.log('JSON valid')"
```
Expected output: `JSON valid`

- [ ] **Step 5: Commit**

```bash
git add dictionaries/ && git commit -m "feat: add experience subpage dictionary entries (hu/en/de)"
```

---

## Task 2: SubpageShell Component

**Files:** Create `components/experience/SubpageShell.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/experience/SubpageShell.tsx
'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useDict } from '@/components/providers/DictProvider'
import type { Locale } from '@/lib/types'

interface Props {
  children: React.ReactNode
  eyebrow: string
  title: string
  desc: string
}

export default function SubpageShell({ children, eyebrow, title, desc }: Props) {
  const dict = useDict()
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {children}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5">
        <Link href={`/${lang}`} className="font-heading text-lg text-foreground opacity-90 hover:opacity-100 transition-opacity">
          Vityilló
        </Link>
        <Link
          href={`/${lang}`}
          className="font-sans text-xs uppercase tracking-[0.25em] text-foreground/60 hover:text-foreground transition-colors"
          data-cursor="view"
        >
          {dict.experiences.back}
        </Link>
      </div>

      {/* Bottom content card */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 sm:p-8 lg:p-12">
        <div className="max-w-xl bg-background/80 backdrop-blur-md border border-foreground/10 rounded-2xl p-6 lg:p-8 shadow-2xl">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-foreground/50 mb-2">{eyebrow}</p>
          <h1 className="font-heading text-3xl sm:text-4xl text-foreground mb-3 leading-tight">{title}</h1>
          <p className="font-sans text-sm text-foreground/60 leading-relaxed mb-6">{desc}</p>
          <Link
            href={`/${lang}#booking`}
            className="inline-block bg-foreground text-background font-sans font-semibold text-sm px-7 py-3 rounded-full hover:opacity-90 transition-opacity"
            data-cursor="view"
          >
            {dict.experiences.bookCta}
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/experience/SubpageShell.tsx && git commit -m "feat: add SubpageShell shared layout for experience subpages"
```

---

## Task 3: JacuzziCanvas Component

**Files:** Create `components/experience/JacuzziCanvas.tsx`

2D wave height-field using the same finite-difference wave equation as Phase 2 (`string-physics.ts`) but on a 2D grid. Mouse splash creates circular displacement. Scroll increases amplitude.

- [ ] **Step 1: Create the component**

```tsx
// components/experience/JacuzziCanvas.tsx
'use client'
import { useRef, useEffect } from 'react'
import gsap, { ScrollTrigger } from '@/lib/gsap'

const GW = 80, GH = 80, DAMP = 0.994

type Grid = { h: Float32Array; hPrev: Float32Array }

function makeGrid(): Grid {
  return { h: new Float32Array(GW * GH), hPrev: new Float32Array(GW * GH) }
}

function stepFluid(g: Grid, c2: number) {
  const { h, hPrev } = g
  const next = new Float32Array(GW * GH)
  for (let y = 1; y < GH - 1; y++) {
    for (let x = 1; x < GW - 1; x++) {
      const i = y * GW + x
      next[i] = (2 * h[i] - hPrev[i] + c2 * (h[i-1] + h[i+1] + h[i-GW] + h[i+GW] - 4 * h[i])) * DAMP
    }
  }
  hPrev.set(h); h.set(next)
}

function splash(g: Grid, fx: number, fy: number, amp: number) {
  const cx = Math.round(fx * GW), cy = Math.round(fy * GH), r = 3
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const nx = cx + dx, ny = cy + dy
      if (nx < 1 || nx >= GW-1 || ny < 1 || ny >= GH-1) continue
      const d = Math.sqrt(dx*dx + dy*dy)
      if (d <= r) g.h[ny * GW + nx] += amp * (1 - d/r)
    }
  }
}

export default function JacuzziCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grid = useRef(makeGrid())
  const ampRef = useRef(1.0)
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const st = ScrollTrigger.create({
      trigger: document.body, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => { ampRef.current = 1 + self.progress * 3 },
    })

    const ambientInterval = setInterval(() => {
      splash(grid.current, Math.random(), Math.random(), 10 * ampRef.current)
    }, 700)

    const onMouseMove = (e: MouseEvent) => {
      splash(grid.current, e.clientX / window.innerWidth, e.clientY / window.innerHeight, 18 * ampRef.current)
    }
    window.addEventListener('mousemove', onMouseMove)

    const ctx = canvas.getContext('2d')!
    const isDark = () => document.documentElement.classList.contains('dark')

    const loop = () => {
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
          ctx.fillStyle = `rgba(${Math.round(br*lum)},${Math.round(bg*lum)},${Math.round(bb*lum)},${alpha.toFixed(3)})`
          ctx.fillRect(x * cw, y * ch, cw + 1, ch + 1)
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearInterval(ambientInterval)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      st.kill()
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 z-[1]" aria-hidden />
}
```

- [ ] **Step 2: Commit**

```bash
git add components/experience/JacuzziCanvas.tsx && git commit -m "feat: add JacuzziCanvas 2D wave fluid simulation"
```

---

## Task 4: SaunaScene Component

**Files:** Create `components/experience/SaunaScene.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/experience/SaunaScene.tsx
'use client'
import { useRef, useEffect } from 'react'
import gsap, { ScrollTrigger } from '@/lib/gsap'

interface Particle { x: number; y: number; vx: number; vy: number; r: number; alpha: number; life: number; maxLife: number }

function makeParticle(W: number, H: number): Particle {
  const maxLife = 120 + Math.random() * 80
  return { x: W * 0.1 + Math.random() * W * 0.8, y: H + 10, vx: (Math.random()-0.5) * 0.6, vy: -(0.8 + Math.random() * 1.2), r: 8 + Math.random() * 18, alpha: 0, life: 0, maxLife }
}

export default function SaunaScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const turbRef = useRef<SVGFETurbulenceElement>(null)
  const dispRef = useRef<SVGFEDisplacementMapElement>(null)
  const particles = useRef<Particle[]>([])
  const intensityRef = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const st = ScrollTrigger.create({
      trigger: document.body, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => { intensityRef.current = self.progress },
    })

    for (let i = 0; i < 30; i++) {
      const p = makeParticle(window.innerWidth, window.innerHeight)
      p.life = Math.floor(Math.random() * p.maxLife)
      particles.current.push(p)
    }

    const ctx = canvas.getContext('2d')!
    let frame = 0
    const isDark = () => document.documentElement.classList.contains('dark')

    const loop = () => {
      frame++
      const intensity = intensityRef.current
      const W = canvas.width, H = canvas.height
      const scale = 8 + intensity * 28
      const freq = (0.006 + intensity * 0.014 + Math.sin(frame * 0.008) * 0.002).toFixed(4)

      if (turbRef.current) turbRef.current.setAttribute('baseFrequency', `${freq} ${(parseFloat(freq) * 0.7).toFixed(4)}`)
      if (dispRef.current) dispRef.current.setAttribute('scale', String(Math.round(scale)))

      ctx.clearRect(0, 0, W, H)
      const dark = isDark()
      const r = dark ? 255 : 26, g = dark ? 244 : 71, b = dark ? 204 : 49

      const emitRate = 1 + Math.floor(intensity * 3)
      for (let i = 0; i < emitRate; i++) {
        if (particles.current.length < 100) particles.current.push(makeParticle(W, H))
      }

      particles.current = particles.current.filter((p) => {
        p.life++
        p.x += p.vx + Math.sin(frame * 0.02 + p.x * 0.01) * 0.4
        p.y += p.vy
        p.vx += (Math.random() - 0.5) * 0.05
        const lf = p.life / p.maxLife
        p.alpha = lf < 0.3 ? lf / 0.3 * 0.2 : (1 - lf) * 0.2
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * (0.5 + lf * 0.5), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha.toFixed(3)})`
        ctx.fill()
        return p.life < p.maxLife && p.y > -p.r * 2
      })

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      st.kill()
    }
  }, [])

  return (
    <>
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden>
        <defs>
          <filter id="sauna-distort" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence ref={turbRef} type="turbulence" baseFrequency="0.006 0.004" numOctaves="3" seed="2" result="noise" />
            <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div className="absolute inset-0 z-[1]" style={{ filter: 'url(#sauna-distort)' }} aria-hidden />
      <canvas ref={canvasRef} className="absolute inset-0 z-[2] pointer-events-none" aria-hidden />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/experience/SaunaScene.tsx && git commit -m "feat: add SaunaScene SVG heat-haze + steam particles"
```

---

## Task 5: BogracCanvas Component

**Files:** Create `components/experience/BogracCanvas.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/experience/BogracCanvas.tsx
'use client'
import { useRef, useEffect } from 'react'

interface Ember { x: number; y: number; vx: number; vy: number; size: number; life: number; maxLife: number }

function emberColor(lifeFrac: number, dark: boolean): string {
  const a = (1 - lifeFrac) * (lifeFrac < 0.6 ? 0.9 : (1 - (lifeFrac - 0.6) / 0.4) * 0.9)
  return dark
    ? `rgba(255,244,204,${a.toFixed(3)})`
    : `rgba(26,71,49,${a.toFixed(3)})`
}

function makeEmber(W: number, H: number, speed: number): Ember {
  return {
    x: W * 0.35 + Math.random() * W * 0.3,
    y: H * 0.85 + Math.random() * H * 0.1,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -(1.5 + Math.random() * 2.5 + speed * 2),
    size: 1.5 + Math.random() * 4,
    life: 0,
    maxLife: 60 + Math.random() * 90,
  }
}

export default function BogracCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const embers = useRef<Ember[]>([])
  const scrollSpeedRef = useRef(0)
  const prevScrollY = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const onScroll = () => {
      scrollSpeedRef.current = Math.min(Math.abs(window.scrollY - prevScrollY.current) / 20, 1)
      prevScrollY.current = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // Seed
    for (let i = 0; i < 40; i++) {
      const e = makeEmber(window.innerWidth, window.innerHeight, 0)
      e.life = Math.floor(Math.random() * e.maxLife)
      embers.current.push(e)
    }

    const ctx = canvas.getContext('2d')!
    let frame = 0
    const isDark = () => document.documentElement.classList.contains('dark')

    const loop = () => {
      frame++
      const W = canvas.width, H = canvas.height
      const speed = scrollSpeedRef.current
      scrollSpeedRef.current *= 0.92

      const emit = 1 + Math.floor(speed * 8)
      for (let i = 0; i < emit; i++) {
        if (embers.current.length < 200) embers.current.push(makeEmber(W, H, speed))
      }

      ctx.clearRect(0, 0, W, H)
      const dark = isDark()

      embers.current = embers.current.filter((e) => {
        e.life++
        // vec = (vx + sin(time)*drift, vy - buoyancy)
        e.vx += Math.sin(frame * 0.04 + e.x * 0.01) * 0.06
        e.vy -= 0.02
        e.x += e.vx; e.y += e.vy
        const lf = e.life / e.maxLife
        const scale = 1 - lf * 0.6

        ctx.beginPath()
        ctx.arc(e.x, e.y, e.size * scale, 0, Math.PI * 2)
        ctx.fillStyle = emberColor(lf, dark)
        ctx.fill()

        if (lf < 0.3) {
          const ga = (0.3 - lf) / 0.3 * 0.12
          ctx.beginPath()
          ctx.arc(e.x, e.y, e.size * scale * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = dark ? `rgba(255,244,204,${ga.toFixed(3)})` : `rgba(26,71,49,${ga.toFixed(3)})`
          ctx.fill()
        }
        return e.life < e.maxLife && e.y > -20
      })

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 z-[1]" aria-hidden />
}
```

- [ ] **Step 2: Commit**

```bash
git add components/experience/BogracCanvas.tsx && git commit -m "feat: add BogracCanvas ember particle engine with scroll velocity"
```

---

## Task 6: Route Pages

**Files:** Create `app/[lang]/jacuzzi/page.tsx`, `app/[lang]/sauna/page.tsx`, `app/[lang]/bograc/page.tsx`

**Note on `PageProps`:** The existing codebase uses `PageProps<'/[lang]'>` in `app/[lang]/page.tsx`. If that generic type isn't available, use `type Props = { params: Promise<{ lang: string }> }` instead.

- [ ] **Step 1: Create all three route pages**

`app/[lang]/jacuzzi/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'
import { DictProvider } from '@/components/providers/DictProvider'
import SubpageShell from '@/components/experience/SubpageShell'
import JacuzziCanvas from '@/components/experience/JacuzziCanvas'

type Props = { params: Promise<{ lang: string }> }

export default async function JacuzziPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const exp = dict.experiences.jacuzzi
  return (
    <DictProvider dict={dict}>
      <SubpageShell eyebrow={exp.eyebrow} title={exp.title} desc={exp.detail}>
        <JacuzziCanvas />
      </SubpageShell>
    </DictProvider>
  )
}
```

`app/[lang]/sauna/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'
import { DictProvider } from '@/components/providers/DictProvider'
import SubpageShell from '@/components/experience/SubpageShell'
import SaunaScene from '@/components/experience/SaunaScene'

type Props = { params: Promise<{ lang: string }> }

export default async function SaunaPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const exp = dict.experiences.sauna
  return (
    <DictProvider dict={dict}>
      <SubpageShell eyebrow={exp.eyebrow} title={exp.title} desc={exp.detail}>
        <SaunaScene />
      </SubpageShell>
    </DictProvider>
  )
}
```

`app/[lang]/bograc/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'
import { DictProvider } from '@/components/providers/DictProvider'
import SubpageShell from '@/components/experience/SubpageShell'
import BogracCanvas from '@/components/experience/BogracCanvas'

type Props = { params: Promise<{ lang: string }> }

export default async function BogracPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const exp = dict.experiences.bograc
  return (
    <DictProvider dict={dict}>
      <SubpageShell eyebrow={exp.eyebrow} title={exp.title} desc={exp.detail}>
        <BogracCanvas />
      </SubpageShell>
    </DictProvider>
  )
}
```

- [ ] **Step 2: Build check**

```bash
cd "C:\Users\narin\Desktop\vityilló" && npm run build 2>&1 | tail -25
```

Expected: TypeScript clean. Routes include `/hu/jacuzzi`, `/en/jacuzzi`, `/de/jacuzzi`, `/hu/sauna`, etc. (9 new locale routes).

If TypeScript error on `dict.experiences` — the `lib/types.ts` uses `typeof hu` so adding to `hu.json` automatically extends the type. Ensure `hu.json` was saved with valid JSON.

- [ ] **Step 3: Commit**

```bash
git add app/[lang]/jacuzzi/ app/[lang]/sauna/ app/[lang]/bograc/
git commit -m "feat: add jacuzzi, sauna, bograc experience route pages"
```

---

## Task 7: Landing Page "Explore" Links

**Files:** Modify `components/sections/Amenities.tsx`

- [ ] **Step 1: Add imports at the top of `components/sections/Amenities.tsx`**

After the existing imports, add:
```tsx
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Locale } from '@/lib/types'
```

- [ ] **Step 2: Add lang + experience link map inside the `Amenities` component function**

Add at the start of the `Amenities()` function body (after `const dict = useDict()`):
```tsx
const params = useParams()
const lang = (params?.lang as Locale) ?? 'hu'

const EXPERIENCE_LINKS: Partial<Record<AmenityKey, string>> = {
  sauna: `/${lang}/sauna`,
  pool:  `/${lang}/jacuzzi`,
  grill: `/${lang}/bograc`,
}
```

- [ ] **Step 3: Add "Explore" link inside the amenity card JSX**

Inside the card `<div>` (the `.amenity-card` div), after the `<p>` tag with `dict.amenities[key].desc`, add:
```tsx
{EXPERIENCE_LINKS[key] && (
  <Link
    href={EXPERIENCE_LINKS[key]!}
    className="inline-flex items-center gap-1.5 mt-4 text-xs font-sans text-foreground/50 hover:text-foreground transition-colors tracking-wide uppercase"
    data-cursor="view"
  >
    Explore <span aria-hidden>→</span>
  </Link>
)}
```

- [ ] **Step 4: Build and commit**

```bash
cd "C:\Users\narin\Desktop\vityilló" && npm run build 2>&1 | tail -10
git add components/sections/Amenities.tsx
git commit -m "feat: add Explore links on sauna/pool/grill amenity cards"
```

---

## Spec Coverage Audit

| Requirement (prompt.md) | Task |
|---|---|
| Jacuzzi: fluid dynamics canvas, mouse = force transmitter | Task 3 — `splash()` on mousemove |
| Jacuzzi: scroll increases wave frequency/amplitude | Task 3 — `ampRef` from ScrollTrigger |
| Sauna: steam particle canvas | Task 4 — rising Gaussian particles |
| Sauna: SVG `feTurbulence` + `feDisplacementMap` | Task 4 — animated filter on wrapper div |
| Sauna: animate `baseFrequency` | Task 4 — updated each RAF frame |
| Sauna: scroll → deeper distortion | Task 4 — `scale` grows with `intensityRef` |
| Bogrács: ember particles with `sin(time)*drift` + buoyancy | Task 5 — exact formula |
| Bogrács: scroll velocity → emission rate | Task 5 — `scrollSpeedRef` from scroll delta |
| Bogrács: color cream → green (hot → cool) | Task 5 — `emberColor()` by `lifeFrac` |
| Dedicated routes `/[lang]/jacuzzi` etc. | Task 6 |
| PageTransitionOverlay on route change | Phase 1 already handles this |
| Links from landing page | Task 7 — Explore links on amenity cards |
| Theme-aware colors | All canvas components call `isDark()` per frame |
