/**
 * Effects budget — one decision, made once, before first paint.
 *
 * The site's decorative layer (a ~12 000px pinned GSAP cinematic backed by two
 * videos, Lenis smooth scroll, pointer-following canvases, scroll-reveal
 * timelines, backdrop blurs) costs far more than a low-end phone on a slow
 * link can pay. Rather than degrade each piece separately, everything reads a
 * single `data-fx` attribute on <html>:
 *
 *   full  — run the whole decorative layer
 *   lite  — skip it: content paints immediately, no video, no smooth scroll
 *
 * The attribute is written by FX_BOOTSTRAP (a beforeInteractive inline script)
 * so CSS can key off it in the very first style resolution — a React effect
 * would be a frame too late and would flash. `fxFull()` below is the JS mirror;
 * both must agree, so neither side re-derives the heuristic.
 *
 * Failure modes deliberately fall to the *visible, cheap* side: a thrown
 * bootstrap sets 'lite', and no attribute at all (JS disabled) matches neither
 * selector, which leaves reveal-hidden content visible rather than blank.
 */

export type FxMode = 'full' | 'lite'

/** localStorage key that pins the mode, overriding the heuristic. Set it to
 *  'lite' or 'full' to exercise either path on any machine — the detection
 *  below is otherwise untestable without the hardware it describes. */
export const FX_OVERRIDE_KEY = 'vityillo-fx'

/**
 * Runs before first paint. Kept as a hand-minified string rather than a module
 * because it must execute ahead of any bundle download.
 *
 * Heuristic — any one of these forces 'lite':
 *   - the OS asked for reduced motion or reduced data
 *   - Save-Data is on, or the effective connection is worse than 4g
 *   - the device reports < 4 GB RAM, or <= 4 logical cores
 */
export const FX_BOOTSTRAP = `(function(){var d=document.documentElement;try{var o=localStorage.getItem('${FX_OVERRIDE_KEY}');if(o==='lite'||o==='full'){d.setAttribute('data-fx',o);return}var l=false,m=window.matchMedia;if(m){if(m('(prefers-reduced-motion: reduce)').matches)l=true;if(m('(prefers-reduced-data: reduce)').matches)l=true}var c=navigator.connection;if(c){if(c.saveData)l=true;if(c.effectiveType&&c.effectiveType!=='4g')l=true}var r=navigator.deviceMemory;if(typeof r==='number'&&r<4)l=true;var p=navigator.hardwareConcurrency;if(typeof p==='number'&&p<=4)l=true;d.setAttribute('data-fx',l?'lite':'full')}catch(e){d.setAttribute('data-fx','lite')}})()`

/** The mode chosen by FX_BOOTSTRAP. 'lite' whenever it could not be read. */
export function fxMode(): FxMode {
  if (typeof document === 'undefined') return 'lite'
  return document.documentElement.getAttribute('data-fx') === 'full' ? 'full' : 'lite'
}

/** True only when the full decorative layer is affordable on this device. */
export function fxFull(): boolean {
  return fxMode() === 'full'
}

/**
 * Class marking an element whose scroll-reveal timeline starts at opacity 0.
 * globals.css only applies that start state under `data-fx="full"`, so in lite
 * mode — and with JS off — the element simply stays visible instead of waiting
 * for a tween that will never run.
 */
export const FX_REVEAL = 'fx-reveal'
