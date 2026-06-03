# CinematicSkipPrompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Hero section so CinematicStory is the landing screen, and add a fixed popup that blurs the background, locks scroll, and lets the user skip the cinematic experience.

**Architecture:** A new `CinematicSkipPrompt` client component renders two fixed-position `div`s (full-screen blur overlay + bottom-center card) outside `<main>`. It uses `useLenis()` to stop/start scroll and GSAP for entrance/exit animations. sessionStorage prevents re-showing on back navigation.

**Tech Stack:** Next.js 16, React 19, GSAP (from `@/lib/gsap`), Lenis (`useLenis` from `@/components/engine/LenisProvider`), Tailwind v4

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/engine/CinematicSkipPrompt.tsx` | CREATE | Blur overlay + card, scroll lock, skip/watch logic |
| `app/[lang]/page.tsx` | MODIFY | Remove Hero import+JSX, add CinematicSkipPrompt |

---

## Task 1: Remove Hero from the page

**Files:**
- Modify: `app/[lang]/page.tsx`

- [ ] **Step 1: Edit page.tsx — remove Hero import and JSX**

Open `app/[lang]/page.tsx`. Make these two changes:

Remove line 6:
```tsx
import Hero from '@/components/sections/Hero'
```

Remove line 26:
```tsx
<Hero />
```

The file should look like this after editing:
```tsx
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from './dictionaries'
import { DictProvider } from '@/components/providers/DictProvider'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CinematicStory from '@/components/sections/CinematicStory'
import About from '@/components/sections/About'
import Amenities from '@/components/sections/Amenities'
import Rooms from '@/components/sections/Rooms'
import Gallery from '@/components/sections/Gallery'
import Booking from '@/components/sections/Booking'
import Location from '@/components/sections/Location'
import Testimonials from '@/components/sections/Testimonials'

export default async function LangPage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <DictProvider dict={dict}>
      <Navbar />
      <main>
        <CinematicStory />
        <About />
        <Amenities />
        <Rooms />
        <Gallery />
        <Booking />
        <Location />
        <Testimonials />
      </main>
      <Footer />
    </DictProvider>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd "c:\Users\narin\Desktop\vityilló" && npx tsc --noEmit
```

Expected: no errors about Hero.

- [ ] **Step 3: Commit**

```bash
git add "app/[lang]/page.tsx"
git commit -m "feat: remove Hero section — CinematicStory is now the landing screen"
```

---

## Task 2: Create CinematicSkipPrompt component

**Files:**
- Create: `components/engine/CinematicSkipPrompt.tsx`

- [ ] **Step 1: Create the file with complete implementation**

Create `components/engine/CinematicSkipPrompt.tsx`:

```tsx
'use client'
import { useRef, useEffect, useState } from 'react'
import gsap from '@/lib/gsap'
import { useLenis } from '@/components/engine/LenisProvider'

export default function CinematicSkipPrompt() {
  const [visible, setVisible] = useState(false)
  const overlayRef   = useRef<HTMLDivElement>(null)
  const cardRef      = useRef<HTMLDivElement>(null)
  const lenis        = useLenis()
  const dismissedRef = useRef(false)

  // Show after 1s; skip if already seen this session
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('cinematic-prompt-seen')) {
      return
    }
    const timer = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Animate in + lock scroll when visible becomes true
  useEffect(() => {
    if (!visible) return
    const overlay = overlayRef.current
    const card    = cardRef.current
    if (!overlay || !card) return

    lenis?.stop()

    gsap.fromTo(overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power3.out' }
    )
    gsap.fromTo(card,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.08 }
    )
  }, [visible, lenis])

  const dismiss = (callback?: () => void) => {
    if (dismissedRef.current) return
    dismissedRef.current = true

    sessionStorage.setItem('cinematic-prompt-seen', '1')

    gsap.to([cardRef.current, overlayRef.current], {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        lenis?.start()
        setVisible(false)
        callback?.()
      },
    })
  }

  const handleWatch = () => dismiss()

  const handleSkip = () =>
    dismiss(() => {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
    })

  if (!visible) return null

  return (
    <>
      {/* Full-screen blur overlay */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(10, 26, 16, 0.55)',
        }}
      />

      {/* Bottom-center card */}
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: 'calc(100% - 2rem)',
          maxWidth: 400,
          background: '#0a1a10',
          border: '1px solid rgba(255,244,204,0.15)',
          borderRadius: 14,
          padding: '1.5rem',
        }}
      >
        <p className="font-heading text-[#FFF4CC] text-lg leading-snug mb-1">
          Egy filmszerű élmény vár rád
        </p>
        <p className="font-sans text-[rgba(255,244,204,0.5)] text-xs leading-relaxed mb-5">
          Görgetéssel irányítod a történetet — vagy átugorhatod.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-2.5 rounded-full border border-[rgba(255,244,204,0.35)] text-[rgba(255,244,204,0.6)] font-sans text-sm hover:bg-[rgba(255,244,204,0.08)] transition-colors"
          >
            Átugrás
          </button>
          <button
            onClick={handleWatch}
            className="flex-1 py-2.5 rounded-full bg-[#FFF4CC] text-[#1A4731] font-sans font-semibold text-sm hover:scale-[1.03] transition-transform"
          >
            Nézem →
          </button>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd "c:\Users\narin\Desktop\vityilló" && npx tsc --noEmit
```

Expected: zero errors in `CinematicSkipPrompt.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/engine/CinematicSkipPrompt.tsx
git commit -m "feat: add CinematicSkipPrompt — blur overlay, scroll lock, skip to About"
```

---

## Task 3: Wire CinematicSkipPrompt into page.tsx

**Files:**
- Modify: `app/[lang]/page.tsx`

- [ ] **Step 1: Add import and JSX**

Add this import to `app/[lang]/page.tsx` after the last existing import:
```tsx
import CinematicSkipPrompt from '@/components/engine/CinematicSkipPrompt'
```

Add `<CinematicSkipPrompt />` as the first child of `<DictProvider>`, before `<Navbar />`:
```tsx
return (
  <DictProvider dict={dict}>
    <CinematicSkipPrompt />
    <Navbar />
    <main>
      <CinematicStory />
      <About />
      <Amenities />
      <Rooms />
      <Gallery />
      <Booking />
      <Location />
      <Testimonials />
    </main>
    <Footer />
  </DictProvider>
)
```

- [ ] **Step 2: TypeScript check**

```bash
cd "c:\Users\narin\Desktop\vityilló" && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Build check**

```bash
cd "c:\Users\narin\Desktop\vityilló" && npm run build
```

Expected: successful build. Image optimization warnings are acceptable.

- [ ] **Step 4: Manual visual verification**

Start dev server:
```bash
npm run dev
```

Open `http://localhost:3000/hu` and verify all 7 checkpoints:

1. **Hero gone** — page opens directly on the dark CinematicStory forest image
2. **Prompt appears ~1s after load** — blur overlay fades in, card slides up from bottom
3. **Scroll locked** — trying to scroll does nothing while card is visible
4. **"Nézem →"** — overlay + card fade out, scroll unlocks, CinematicStory is scrollable
5. **"Átugrás"** — overlay fades out, page scrolls smoothly to About section, scroll unlocks
6. **Refresh after dismiss** — prompt does NOT reappear (sessionStorage)
7. **New tab** — prompt appears again (sessionStorage is per-tab/per-session)

- [ ] **Step 5: Commit**

```bash
git add "app/[lang]/page.tsx"
git commit -m "feat: wire CinematicSkipPrompt into page — skip flow complete"
```
