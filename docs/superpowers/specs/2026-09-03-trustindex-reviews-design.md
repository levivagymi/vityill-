# Trustindex live reviews in GuestStories

**Date:** 2026-09-03
**Status:** Approved

## Problem

Vityilló's guest-review wall (`components/sections/GuestStories.tsx`, rendered via `GuestStoriesLazy` in `app/[lang]/page.tsx`) shows five hand-written, fictional testimonials sourced from `dict.testimonials.stories`. The client has a live Trustindex widget (embed code `c45484e807626631c386f41a430`, aggregating Google reviews) and wants the wall to show **real** reviews, rendered in the site's own existing card design — not Trustindex's default widget UI.

Note: `components/sections/Testimonials.tsx` is a second, unrelated review component with a different (image-less) card design. It is **dead code** — not imported anywhere in `app/`. It is out of scope and left untouched.

## Discovery evidence

Verified live against the real embed code (`https://cdn.trustindex.io/loader.js?c45484e807626631c386f41a430`) by injecting it into a throwaway probe page served through the project's own dev server and inspecting the resulting DOM with `javascript_tool`:

- The loader script mounts its widget as a child of **its own `<script>` tag's parent element** (not always `document.body` — confirmed both ways: a bare script under `<body>` produced a `.ti-widget` sibling of `<body>`'s children; a script wrapped in a `display:none` div produced `.ti-widget` **inside** that hidden div). So the user's original "wrap the script in a hidden container" approach is structurally correct — Trustindex mounts there.
- With `display:none` on the wrapper, the widget still fully populates (`.ti-review-item` count and data attributes identical to the unhidden case) — no layout-dependent short-circuiting.
- Confirmed DOM shape (`layout-id=16`, `light-contrast`, `layout-category=grid`):
  ```
  .ti-widget[data-pid][data-layout-category="grid"]
    .ti-widget-container
      .ti-reviews-container
        .ti-reviews-container-wrapper
          .ti-review-item[data-id][data-rating][data-max-rating][data-time][class*="source-Google"]
            .ti-inner
              .ti-review-header
                .ti-profile-img > img[alt="{name} profile picture"]
                .ti-profile-details
                  .ti-name                 → author name (text)
                  .ti-date                 → relative text + nested .ti-tooltip (absolute date string)
                .ti-stars                  → star icons (rating is more reliably read from data-rating)
              .ti-review-text-container[.ti-empty-text when blank] → quote text
  ```
- **Rating** is read from `data-rating`/`data-max-rating` on `.ti-review-item` (e.g. `"5.0"`/`"5"`) — far more robust than counting star `<img>` fill states.
- **No location/city field exists** for Google-sourced reviews — only name, rating, relative/absolute date, and platform (from the `source-Google` class token). This differs from the static content's `country` field.
- **Many real reviews carry no written text** — 2 of 2 sampled from the live account were rating-only, with Trustindex substituting the placeholder string `"This user only left a rating."` and adding a `ti-empty-text` class to `.ti-review-text-container`. These must be filtered out; a quote-card design cannot show a placeholder sentence as if it were a real review.
- Trustindex injects one external stylesheet (`https://cdn.trustindex.io/assets/widget-presetted-css/v2/16-light-contrast.css`), scoped entirely to `ti-`-prefixed classes that don't exist anywhere else on the site. Combined with the wrapper's `display:none`, no visual bleed into site styling is possible — no extra CSS scoping/reset work needed.
- The widget paginates further reviews behind a "load more" control (`data-load-more-rows="3"`); this design intentionally only harvests the initially-rendered batch (adequate for a review wall, not an infinite list — see Non-goals).
- No stable public JS data API was found on `window` beyond the internal widget classes (`Trustindex`, `TrustindexReviewWidget`, etc., all functions) — DOM scraping via `MutationObserver`, as originally specified, is the correct approach, not a workaround.
- `package.json` has no test framework (no Vitest/Jest/Playwright) — confirmed by reading it directly. Adding one for this feature alone would be unrelated scope creep.

## Approach

### New file: `lib/trustindex.ts`
Isolates the scraping/parsing "impure edge" from rendering, matching how `lib/booking.ts` / `lib/content.ts` hold single-domain logic elsewhere in this codebase (no `hooks/` directory convention exists here — colocating in `lib/` is the existing pattern).

- `TrustindexReview` type: `{ id: string; name: string; rating: number; maxRating: number; timeEpoch: number; text: string; platform: string }`
- `parseReviewItem(el: Element): TrustindexReview | null` — pure function. Reads `data-id`/`data-rating`/`data-max-rating`/`data-time`, `.ti-name`, `.ti-review-text-container` (returns `null` if `ti-empty-text` or blank text, or if `id`/`name`/`text` end up missing). Reads the `source-<Platform>` class token for `platform`.
- `useTrustindexReviews(): { status: 'loading' | 'ready' | 'unavailable'; reviews: TrustindexReview[] }`:
  1. On mount, guards against double-injection (checks for an existing loader `<script src*="trustindex.io/loader.js">` before creating one — safe under React 18 dev double-effects).
  2. Creates a `<div hidden style="display:none">` appended to `document.body` containing the `<script defer async src="https://cdn.trustindex.io/loader.js?c45484e807626631c386f41a430">`.
  3. `MutationObserver` (`childList: true, subtree: true`) on that div. Each mutation batch: re-query `.ti-review-item`, run `parseReviewItem`, merge into a `Map` keyed by `id` (dedup), restart a 600ms "quiet" debounce.
  4. Settles (disconnects observer, sets status) on 600ms of quiet **or** an 8s hard ceiling, whichever comes first. `status` becomes `'ready'` if ≥1 usable review parsed, else `'unavailable'`.
  5. Effect cleanup disconnects the observer and clears timers. The injected script/div itself is intentionally left in place (this section doesn't unmount during normal navigation; tearing down a third-party loader mid-flight risks console errors from its own internal callbacks — accepted tradeoff).

### Modified: `components/sections/GuestStories.tsx`
`StoryCard`, the marquee/GSAP drift, and the stat strip stay **exactly as they are today** — this was the explicit ask. Only the data feeding `stories` changes:

- `const { status, reviews: liveReviews } = useTrustindexReviews()`
- `MIN_LIVE_REVIEWS = 3` — below this the wall would look sparse; stay on the static set.
- `const useLive = status === 'ready' && liveReviews.length >= MIN_LIVE_REVIEWS`
- When `useLive`: map each `TrustindexReview` to the existing `Story` shape — `name`, `country: platform` (e.g. `"Google"`, filling the same figcaption slot the static data uses for city/country), `rating: Math.round(rating)` (existing `Stars` takes an integer 0–5), `quote: text`, `image: STORY_IMAGES[i % STORY_IMAGES.length]` (same cyclical assignment already used for the static set).
- When not `useLive`: unchanged — today's `dict.testimonials.stories` mapping.
- The static set renders immediately on first paint regardless (no skeleton, no layout shift — this **is** the loading state visually). If/when the swap to live data happens, it fades in using the same `gsap`/`allowAmbientMotion`-gated pattern already used elsewhere in this file, rather than introducing a new animation primitive.
- The "5.0 / 100% / ★★★★★" stat strip at the bottom stays static copy in both cases — not recomputed from live ratings (smaller scope; avoids a second, unrequested design decision around weighted averages).

### Non-goals
- No "load more" pagination — only the initial rendered batch is harvested.
- No test suite added — none exists in this project; verification is `tsc --noEmit` + `eslint` + live browser check against the real embed code.
- `Testimonials.tsx` (dead code) is not touched, removed, or wired up.
- No changes to i18n dictionaries — the fallback path keeps using `dict.testimonials.stories` exactly as today, in all three locales.

## Error handling & safety
- Review name/text are rendered via normal JSX interpolation (React auto-escapes) — never `dangerouslySetInnerHTML`, no sanitizer dependency needed.
- A single malformed `.ti-review-item` just drops out of the batch (`parseReviewItem` returns `null`); it never throws and never blocks the rest of the batch.
- Script failure, network block, and "not enough reviews yet" are all indistinguishable from the UI's perspective — all three simply keep the static fallback visible, with no error state surfaced to visitors (this is marketing content; a broken-looking wall is worse than curated copy).

## Verification plan
1. `tsc --noEmit` and `eslint` clean on the touched files.
2. Live browser check via the dev server: confirm the hidden container never becomes visible (no FOUC of Trustindex's own styling), confirm cards populate with real Google review data once the debounce settles, confirm cover images still cycle correctly, confirm the fallback holds correctly when the live count is artificially forced below `MIN_LIVE_REVIEWS`.
3. Check browser console for errors/warnings introduced by the change.
