# Trustindex Live Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Feed real Google reviews (via the client's Trustindex widget) into the site's existing `GuestStories` card wall, replacing the hard-coded fictional testimonials once enough usable live reviews are available, with zero visual change to the card design itself.

**Architecture:** A new `lib/trustindex.ts` module injects the Trustindex loader script into a hidden container, watches it with a `MutationObserver`, and parses `.ti-review-item` nodes into a typed `TrustindexReview[]` via a `useTrustindexReviews()` hook. `components/sections/GuestStories.tsx` consumes that hook and swaps its existing `stories` array between live and static data — `StoryCard`, the marquee drift, and the stat strip are untouched.

**Tech Stack:** Next.js 16 / React 19 client component, native DOM APIs (`MutationObserver`), GSAP (already a project dependency, imported via `@/lib/gsap`), no new dependencies.

## Global Constraints

- No test framework exists in this project (`package.json` has no Vitest/Jest/Playwright) — do not add one. Verify with `npx tsc --noEmit`, `npm run lint`, and live browser checks instead of unit tests.
- Never use `dangerouslySetInnerHTML` for review name/text — plain JSX interpolation only (React auto-escapes).
- `components/sections/Testimonials.tsx` is unrelated dead code (unused anywhere in `app/`) — do not modify it.
- No changes to `dictionaries/*.json` — the fallback path must keep using `dict.testimonials.stories` exactly as today, in all three locales.
- No "load more" pagination — only the initially-rendered `.ti-review-item` batch is harvested.
- `StoryCard`, the marquee/GSAP drift effect, and the bottom stat strip (`5.0 / 100% / ★★★★★`) in `GuestStories.tsx` must not change — only the data feeding `stories` changes.
- Settle timing: 600ms of DOM-mutation quiet, or an 8s hard ceiling, whichever comes first.
- Minimum live reviews to switch off the static fallback: `MIN_LIVE_REVIEWS = 3`.
- Loader script URL (exact, do not alter): `https://cdn.trustindex.io/loader.js?c45484e807626631c386f41a430`

---

## File Structure

- **Create:** `lib/trustindex.ts` — types, the loader URL constant, `parseReviewItem()` (pure DOM-node → `TrustindexReview | null` parser), and `useTrustindexReviews()` (the injection + observation hook).
- **Modify:** `components/sections/GuestStories.tsx` — swap the `stories` data source between live and static; no other behavioral change.

---

### Task 1: `lib/trustindex.ts` — types, constant, and the pure parser

**Files:**
- Create: `lib/trustindex.ts`

**Interfaces:**
- Produces: `TRUSTINDEX_LOADER_SRC: string`; `type TrustindexReview = { id: string; name: string; rating: number; maxRating: number; timeEpoch: number; text: string; platform: string }`; `function parseReviewItem(el: Element): TrustindexReview | null`

Real DOM shape this parses (captured live against the actual embed code — see `docs/superpowers/specs/2026-09-03-trustindex-reviews-design.md` for the full discovery trail):

```html
<div class="ti-review-item source-Google ti-image-layout-thumbnail"
     data-id="8da8bbdecbce8cc6632bd54d2e8704f0" data-time="1783543330"
     data-rating="5.0" data-max-rating="5">
  <div class="ti-inner">
    <div class="ti-review-header">
      <div class="ti-profile-details">
        <div class="ti-name"> Levente Káldor </div>
        <div class="ti-date">...</div>
      </div>
    </div>
    <span class="ti-stars">...</span>
    <div class="ti-review-text-container ti-empty-text ti-review-content">This user only left a rating.</div>
  </div>
</div>
```

Reviews with the `ti-empty-text` class (rating-only, no written text) must be filtered out — the card design shows a quote and cannot substitute the placeholder sentence for a real one.

- [ ] **Step 1: Write `lib/trustindex.ts`**

```typescript
export const TRUSTINDEX_LOADER_SRC =
  'https://cdn.trustindex.io/loader.js?c45484e807626631c386f41a430'

export type TrustindexReview = {
  id: string
  name: string
  rating: number
  maxRating: number
  timeEpoch: number
  text: string
  platform: string
}

/**
 * Parses one Trustindex `.ti-review-item` node into a structured review.
 * Returns null for rating-only reviews (`.ti-empty-text`) or nodes missing
 * a name/id/text — both are dropped rather than rendered as broken cards.
 */
export function parseReviewItem(el: Element): TrustindexReview | null {
  const id = el.getAttribute('data-id')
  const nameEl = el.querySelector('.ti-name')
  const textEl = el.querySelector('.ti-review-text-container')

  if (!id || !nameEl || !textEl) return null
  if (textEl.classList.contains('ti-empty-text')) return null

  const name = nameEl.textContent?.trim() ?? ''
  const text = textEl.textContent?.trim() ?? ''
  if (!name || !text) return null

  const rating = parseFloat(el.getAttribute('data-rating') ?? '')
  const maxRating = parseFloat(el.getAttribute('data-max-rating') ?? '')
  const timeEpoch = parseInt(el.getAttribute('data-time') ?? '', 10)

  const sourceClass = Array.from(el.classList).find((c) => c.startsWith('source-'))
  const platform = sourceClass ? sourceClass.slice('source-'.length) : 'Google'

  return {
    id,
    name,
    rating: Number.isFinite(rating) ? rating : 0,
    maxRating: Number.isFinite(maxRating) ? maxRating : 5,
    timeEpoch: Number.isFinite(timeEpoch) ? timeEpoch : 0,
    text,
    platform,
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `lib/trustindex.ts`.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors/warnings on `lib/trustindex.ts`.

- [ ] **Step 4: Manual verification against the real fixture**

No test runner exists in this project, so verify by inspection: paste the HTML sample shown above (the exact fixture) into a scratch `<div>` in a browser console and confirm `parseReviewItem` returns `null` for it (it has `ti-empty-text`), then confirm it returns a populated object when you remove the `ti-empty-text` class and give the text container real text, e.g.:

```javascript
const wrap = document.createElement('div')
wrap.innerHTML = `<div class="ti-review-item source-Google" data-id="abc123" data-rating="5.0" data-max-rating="5" data-time="1783543330">
  <div class="ti-name"> Test Reviewer </div>
  <div class="ti-review-text-container">Wonderful stay, would come back.</div>
</div>`
// then call parseReviewItem(wrap.firstElementChild) via whatever REPL you're using
```
Expected result shape: `{ id: 'abc123', name: 'Test Reviewer', rating: 5, maxRating: 5, timeEpoch: 1783543330, text: 'Wonderful stay, would come back.', platform: 'Google' }`

- [ ] **Step 5: Commit**

```bash
git add lib/trustindex.ts
git commit -m "feat: add Trustindex review DOM parser"
```

---

### Task 2: `lib/trustindex.ts` — `useTrustindexReviews()` hook

**Files:**
- Modify: `lib/trustindex.ts` (append to the file created in Task 1)

**Interfaces:**
- Consumes: `TRUSTINDEX_LOADER_SRC`, `TrustindexReview`, `parseReviewItem` (Task 1, same file)
- Produces: `type TrustindexStatus = 'loading' | 'ready' | 'unavailable'`; `function useTrustindexReviews(): { status: TrustindexStatus; reviews: TrustindexReview[] }`

- [ ] **Step 1: Add the hook to `lib/trustindex.ts`**

First, insert `import { useEffect, useState } from 'react'` as the very first line of the file (imports must sit at the top, above the `TRUSTINDEX_LOADER_SRC` constant from Task 1). Then append the rest of this code to the end of the file:

```typescript
const HIDDEN_CONTAINER_ID = 'trustindex-hidden-mount'
const SETTLE_QUIET_MS = 600
const SETTLE_MAX_MS = 8000

export type TrustindexStatus = 'loading' | 'ready' | 'unavailable'

/**
 * Injects the Trustindex widget into a hidden container, watches it with a
 * MutationObserver, and returns the reviews it renders once the DOM settles
 * (600ms of quiet, or an 8s hard ceiling). The observer disconnects once
 * settled; the injected script/container are left in place (this section
 * doesn't unmount during normal navigation, and tearing down a third-party
 * loader mid-flight risks console errors from its own internal callbacks).
 */
export function useTrustindexReviews(): { status: TrustindexStatus; reviews: TrustindexReview[] } {
  const [status, setStatus] = useState<TrustindexStatus>('loading')
  const [reviews, setReviews] = useState<TrustindexReview[]>([])

  useEffect(() => {
    let container = document.getElementById(HIDDEN_CONTAINER_ID)
    const alreadyInjected =
      !!container || !!document.querySelector('script[src*="trustindex.io/loader.js"]')

    if (!alreadyInjected) {
      container = document.createElement('div')
      container.id = HIDDEN_CONTAINER_ID
      container.hidden = true
      container.style.display = 'none'
      const script = document.createElement('script')
      script.src = TRUSTINDEX_LOADER_SRC
      script.defer = true
      script.async = true
      container.appendChild(script)
      document.body.appendChild(container)
    }

    const target: Element = container ?? document.body
    const found = new Map<string, TrustindexReview>()
    let settled = false
    let quietTimer: ReturnType<typeof setTimeout> | undefined

    const settle = () => {
      if (settled) return
      settled = true
      observer.disconnect()
      clearTimeout(quietTimer)
      clearTimeout(maxTimer)
      setReviews(Array.from(found.values()))
      setStatus(found.size > 0 ? 'ready' : 'unavailable')
    }

    const scan = () => {
      target.querySelectorAll('.ti-review-item').forEach((el) => {
        const parsed = parseReviewItem(el)
        if (parsed) found.set(parsed.id, parsed)
      })
      clearTimeout(quietTimer)
      quietTimer = setTimeout(settle, SETTLE_QUIET_MS)
    }

    const observer = new MutationObserver(scan)
    observer.observe(target, { childList: true, subtree: true })
    scan()

    const maxTimer = setTimeout(settle, SETTLE_MAX_MS)

    return () => {
      observer.disconnect()
      clearTimeout(quietTimer)
      clearTimeout(maxTimer)
    }
  }, [])

  return { status, reviews }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `lib/trustindex.ts`.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors/warnings on `lib/trustindex.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/trustindex.ts
git commit -m "feat: add useTrustindexReviews hook"
```

---

### Task 3: Wire live reviews into `GuestStories.tsx`

**Files:**
- Modify: `components/sections/GuestStories.tsx:1-11` (imports), `:68-80` (component body / `stories` construction), `:132-155` (render block)

**Interfaces:**
- Consumes: `useTrustindexReviews` (Task 2), `TrustindexReview` (Task 1) from `@/lib/trustindex`
- Produces: no new exports — internal behavior change only

The existing `Story` type (`components/sections/GuestStories.tsx:12`) is `Dictionary['testimonials']['stories'][number] & { image: string }`, whose fields are `{ name, country, rating, quote }` (see `dictionaries/hu.json:376-385`). Live reviews map onto that exact same shape — no type changes needed.

- [ ] **Step 1: Add the import**

In `components/sections/GuestStories.tsx`, after the existing `import type { Dictionary } from '@/lib/types'` line (line 10), add:

```typescript
import { useTrustindexReviews } from '@/lib/trustindex'
```

- [ ] **Step 2: Add the minimum-reviews constant**

After the `type Story = ...` line (line 12), add:

```typescript
const MIN_LIVE_REVIEWS = 3
```

- [ ] **Step 3: Replace the `stories` construction**

Find this block inside `export default function GuestStories()`:

```typescript
  const stories: Story[] = dict.testimonials.stories.map((s, i) => ({
    ...s,
    image: STORY_IMAGES[i % STORY_IMAGES.length],
  }))
  const rowA = stories.filter((_, i) => i % 2 === 0)
  const rowB = stories.filter((_, i) => i % 2 === 1)
```

Replace it with:

```typescript
  const { status: trustindexStatus, reviews: liveReviews } = useTrustindexReviews()
  const useLive = trustindexStatus === 'ready' && liveReviews.length >= MIN_LIVE_REVIEWS

  const stories: Story[] = useLive
    ? liveReviews.map((r, i) => ({
        name: r.name,
        country: r.platform,
        rating: Math.round(r.rating),
        quote: r.text,
        image: STORY_IMAGES[i % STORY_IMAGES.length],
      }))
    : dict.testimonials.stories.map((s, i) => ({
        ...s,
        image: STORY_IMAGES[i % STORY_IMAGES.length],
      }))
  const rowA = stories.filter((_, i) => i % 2 === 0)
  const rowB = stories.filter((_, i) => i % 2 === 1)
```

- [ ] **Step 4: Add the fade-in-on-swap refs and effect**

Immediately after the `rowBRef` declaration (`const rowBRef = useRef<HTMLDivElement>(null)`, line 72), add:

```typescript
  const storiesWrapRef = useRef<HTMLDivElement>(null)
  const wasLiveRef = useRef(false)
```

After the existing marquee-drift `useEffect` (the one that calls `drift(rowARef.current, ...)`, ending around line 115), add a new effect:

```typescript
  useEffect(() => {
    if (useLive && !wasLiveRef.current && allowAmbientMotion() && storiesWrapRef.current) {
      gsap.fromTo(
        storiesWrapRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power2.out' },
      )
    }
    wasLiveRef.current = useLive
  }, [useLive])
```

- [ ] **Step 5: Wrap the render block in the fade target**

Find this block (the conditional marquee/static-grid render):

```tsx
      {marquee ? (
        <div className="relative flex flex-col gap-5" role="region" aria-label={dict.testimonials.wallTitle}>
          <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, black 6%, black 94%, transparent)' }}>
            <div ref={rowARef} className="flex w-max gap-5" style={{ willChange: 'transform' }}>
              {[...rowA, ...rowA].map((s, i) => (
                <StoryCard key={`${s.name}-${i}`} story={s} />
              ))}
            </div>
          </div>
          <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, black 6%, black 94%, transparent)' }}>
            <div ref={rowBRef} className="flex w-max gap-5" style={{ willChange: 'transform' }}>
              {[...rowB, ...rowB].map((s, i) => (
                <StoryCard key={`${s.name}-${i}`} story={s} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-5">
          {stories.slice(0, 6).map((s) => (
            <StoryCard key={s.name} story={s} />
          ))}
        </div>
      )}
```

Wrap it in `<div ref={storiesWrapRef}>`:

```tsx
      <div ref={storiesWrapRef}>
        {marquee ? (
          <div className="relative flex flex-col gap-5" role="region" aria-label={dict.testimonials.wallTitle}>
            <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, black 6%, black 94%, transparent)' }}>
              <div ref={rowARef} className="flex w-max gap-5" style={{ willChange: 'transform' }}>
                {[...rowA, ...rowA].map((s, i) => (
                  <StoryCard key={`${s.name}-${i}`} story={s} />
                ))}
              </div>
            </div>
            <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, black 6%, black 94%, transparent)' }}>
              <div ref={rowBRef} className="flex w-max gap-5" style={{ willChange: 'transform' }}>
                {[...rowB, ...rowB].map((s, i) => (
                  <StoryCard key={`${s.name}-${i}`} story={s} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-5">
            {stories.slice(0, 6).map((s) => (
              <StoryCard key={s.name} story={s} />
            ))}
          </div>
        )}
      </div>
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `components/sections/GuestStories.tsx`.

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: no errors/warnings on `components/sections/GuestStories.tsx`.

- [ ] **Step 8: Commit**

```bash
git add components/sections/GuestStories.tsx
git commit -m "feat: swap GuestStories data source to live Trustindex reviews when available"
```

---

### Task 4: End-to-end verification against the real widget

**Files:** none (verification only)

This task proves the full pipeline (inject → observe → parse → filter → map → render → fade) against the real running app, using the project's Browser preview tools. The live Trustindex account currently has 0 reviews with written text among its initial batch (both sampled reviews during design were rating-only), so `useLive` will realistically stay `false` today — that's the expected, correct behavior (fallback holds), not a bug. This task verifies both that fallback path for real, and the live-rendering path via a synthetic DOM injection (since we can't rely on the live account having 3+ written reviews on demand).

- [ ] **Step 1: Start the dev server preview**

Use `preview_start` with `{ "name": "vityillo-dev" }`. Note the assigned `tabId`.

- [ ] **Step 2: Navigate to the homepage and let it settle**

Use `navigate` to the preview's base URL (root path, default locale redirects to `/hu`). Wait ~8-9 seconds (covers the hook's `SETTLE_MAX_MS` ceiling) using `computer` with `action: "wait"`.

- [ ] **Step 3: Confirm the hidden container never becomes visible**

Run via `javascript_tool`:

```javascript
const el = document.getElementById('trustindex-hidden-mount')
JSON.stringify({
  exists: !!el,
  computedDisplay: el ? getComputedStyle(el).display : null,
  boundingRect: el ? el.getBoundingClientRect() : null,
})
```

Expected: `exists: true`, `computedDisplay: "none"`, and a zero-size bounding rect. No Trustindex-styled content should be visible anywhere in a screenshot of the page.

- [ ] **Step 4: Confirm the fallback path is active with the real (currently text-sparse) account**

Run via `javascript_tool` (this reads React state indirectly by checking rendered DOM — since the fallback path is expected, the visible cards should be the known static names):

```javascript
Array.from(document.querySelectorAll('#testimonials figcaption > div:first-child')).map(el => el.textContent.trim())
```

Expected: names from `dict.testimonials.stories` (e.g. "Kovács Eszter", "Thomas Müller", ...), confirming the static fallback is what's rendering — matches the real account's current lack of ≥3 written reviews.

- [ ] **Step 5: Verify the live-rendering path with a synthetic batch**

Since the real account doesn't currently have 3+ written reviews, exercise the live-mapping/render/fade path directly by injecting synthetic `.ti-review-item` nodes into the real hidden container and forcing a page reload with a short delay so the hook is still in its observation window when they appear. Run via `javascript_tool` immediately after a fresh `navigate` to the page (before the 8s ceiling elapses):

```javascript
const container = document.getElementById('trustindex-hidden-mount')
  ?? (() => { const d = document.createElement('div'); d.id = 'trustindex-hidden-mount'; d.hidden = true; d.style.display = 'none'; document.body.appendChild(d); return d })()
const makeItem = (id, name, rating, text) => {
  const item = document.createElement('div')
  item.className = 'ti-review-item source-Google'
  item.setAttribute('data-id', id)
  item.setAttribute('data-rating', String(rating))
  item.setAttribute('data-max-rating', '5')
  item.setAttribute('data-time', String(Math.floor(Date.now() / 1000)))
  item.innerHTML = `<div class="ti-name">${name}</div><div class="ti-review-text-container">${text}</div>`
  return item
}
container.appendChild(makeItem('t1', 'Anna Kovács', 5, 'Gyönyörű környezet, tökéletes pihenés.'))
container.appendChild(makeItem('t2', 'John Smith', 4, 'Lovely stay, would recommend to friends.'))
container.appendChild(makeItem('t3', 'Petra Novak', 5, 'Sauna and pool were fantastic, great hosts.'))
'injected'
```

This must run within the first ~600ms-8s window after the page loads (before the hook's own settle fires) — if the fallback already rendered, do a fresh `navigate` reload and run this script immediately after, before waiting.

- [ ] **Step 6: Confirm the live cards rendered**

Wait ~1s, then run via `javascript_tool`:

```javascript
Array.from(document.querySelectorAll('#testimonials figcaption > div:first-child')).map(el => el.textContent.trim())
```

Expected: `["Anna Kovács", "John Smith", "Petra Novak", "Anna Kovács", "John Smith", "Petra Novak"]` (marquee duplicates each row) or the 3 names once if the static-grid branch is active — either way, the synthetic names must appear, proving `useLive` flipped true and the map produced correct `Story` objects (name/country="Google"/rating/quote/cycled cover image).

- [ ] **Step 7: Check the browser console for errors**

Use `read_console_messages` with `onlyErrors: true`.
Expected: no new errors attributable to this change (pre-existing unrelated warnings, if any, are out of scope).

- [ ] **Step 8: Take a screenshot for visual confirmation**

Use `computer` with `action: "screenshot"`, scrolled to the `#testimonials` section, confirming cards use the existing dark card design (cover image, hover-lift styling, star rating, quote) with no visual difference from the static version other than the content.

- [ ] **Step 9: Record the result**

No commit needed for this task (verification only) — report the outcome (fallback confirmed correct with the real account; live path confirmed correct with the synthetic batch) back to the user.
