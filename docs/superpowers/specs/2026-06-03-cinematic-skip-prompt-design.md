# Design: Hero Removal + CinematicSkipPrompt

**Date:** 2026-06-03  
**Status:** Approved

---

## Summary

Remove the Hero section so the CinematicStory is the first thing users see on load. Add a fixed overlay component (`CinematicSkipPrompt`) that:
- Blurs the background (backdrop-filter)
- Locks scroll (Lenis stop/start)
- Asks the user if they want to skip the cinematic experience
- Skips to the About section if yes

---

## Changes

### 1. Remove Hero

- Delete `<Hero />` and its import from `app/[lang]/page.tsx`
- `CinematicStory` becomes the first child of `<main>`
- The Hero component file (`components/sections/Hero.tsx`) stays untouched — only removed from the page

### 2. New Component: `CinematicSkipPrompt`

**File:** `components/engine/CinematicSkipPrompt.tsx`  
**Type:** `'use client'`

#### Lifecycle

1. Mount → 1000ms timeout → GSAP entrance (overlay + card together)
2. `sessionStorage` key: `cinematic-prompt-seen` — if already set, render nothing (handles back-navigation)
3. On entrance: `lenis.stop()` (scroll locked)
4. On dismiss (any path): `lenis.start()` + `sessionStorage.setItem('cinematic-prompt-seen', '1')` + GSAP fade out

#### Dismiss paths

| Trigger | Action |
|---------|--------|
| "Nézem →" click | fade out overlay + card, then `lenis.start()` |
| "Átugrás" click | `lenis.start()` → fade out → `document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })` |

Note: scroll-based auto-dismiss is NOT used because Lenis is stopped — the user cannot scroll while the prompt is visible.

#### DOM Structure

```
<>
  {/* Blur overlay — fixed, full screen */}
  <div ref={overlayRef}
    style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      backdropFilter: 'blur(10px)',
      background: 'rgba(10, 26, 16, 0.55)',
      opacity: 0
    }}
  />

  {/* Card — fixed, bottom-center */}
  <div ref={cardRef}
    style={{
      position: 'fixed', bottom: '2rem',
      left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999,
      width: '100%', maxWidth: 400,
      background: '#0a1a10',
      border: '1px solid rgba(255,244,204,0.15)',
      borderRadius: 14,
      padding: '1.5rem',
      opacity: 0  // GSAP starts here, y: 20
    }}
  >
    <p>Egy filmszerű élmény vár rád</p>
    <p>Görgetéssel irányítod a történetet</p>
    <button onClick={handleWatch}>Nézem →</button>
    <button onClick={handleSkip}>Átugrás</button>
  </div>
</>
```

#### GSAP Animations

**Entrance:**
```ts
gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power3.out' })
gsap.fromTo(cardRef.current,    { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.08 })
```

**Exit:**
```ts
gsap.to([cardRef.current, overlayRef.current], {
  opacity: 0, duration: 0.4, ease: 'power2.in',
  onComplete: () => setVisible(false)
})
```

#### Scroll Lock

```ts
import { useLenis } from '@/components/engine/LenisProvider'

const lenis = useLenis()

// On show:
lenis?.stop()

// On dismiss:
lenis?.start()
```

#### Styling

| Element | Value |
|---------|-------|
| Overlay bg | `rgba(10, 26, 16, 0.55)` + `backdrop-filter: blur(10px)` |
| Card bg | `#0a1a10` |
| Card border | `1px solid rgba(255,244,204,0.15)` |
| Heading | `#FFF4CC`, `font-heading`, ~18px |
| Subtext | `rgba(255,244,204,0.5)`, `font-sans`, ~12px |
| "Nézem →" | `bg-[#FFF4CC] text-[#1A4731]`, rounded-full, hover scale 1.03 |
| "Átugrás" | `border border-[rgba(255,244,204,0.35)] text-[rgba(255,244,204,0.6)]`, rounded-full, hover white bg |

### 3. Page integration

`app/[lang]/page.tsx`:
```tsx
import CinematicSkipPrompt from '@/components/engine/CinematicSkipPrompt'

// Remove: import Hero from '@/components/sections/Hero'

return (
  <DictProvider dict={dict}>
    <CinematicSkipPrompt />
    <Navbar />
    <main>
      {/* Hero removed */}
      <CinematicStory />
      <About />
      ...
    </main>
    <Footer />
  </DictProvider>
)
```

---

## Edge Cases

- **Reduced motion:** No GSAP; show prompt immediately, hide via `display: none` toggle
- **Mobile:** card `width: calc(100% - 2rem)`; buttons stack vertically below 360px
- **Lenis not yet initialized:** `useLenis()` can return `null` briefly — guard with `lenis?.stop()`
- **Back navigation:** `sessionStorage` prevents re-showing after the user already decided

---

## Files Touched

| File | Change |
|------|--------|
| `app/[lang]/page.tsx` | Remove Hero import + JSX; add CinematicSkipPrompt |
| `components/engine/CinematicSkipPrompt.tsx` | NEW |
