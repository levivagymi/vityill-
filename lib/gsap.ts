import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'

// Flip is deliberately NOT registered here. This module is imported by every
// client component on the site, so anything it pulls in is in the shared chunk
// on every route - and Flip (~15 kB minified) is used by exactly one component,
// on exactly one route. SharedElementFlip imports and registers it itself.

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, CustomEase)
  // House ease — mirror of --ease-cinematic in app/globals.css so CSS
  // transitions and GSAP tweens share one motion signature.
  if (!CustomEase.get('cinematic')) {
    CustomEase.create('cinematic', '0.7,0,0.2,1')
  }
  // iOS/Android browser chrome (address bar) collapsing mid-scroll fires a
  // native 'resize' event. Without this, ScrollTrigger treats it like a real
  // viewport resize and recalculates pin bounds against a height that's
  // still mid-transition, which is what produces a stray gap under pinned
  // sections on mobile Safari.
  ScrollTrigger.config({ ignoreMobileResize: true })
}

export { ScrollTrigger }
export default gsap
