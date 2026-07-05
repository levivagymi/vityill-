import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import { CustomEase } from 'gsap/CustomEase'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, Flip, CustomEase)
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

export { ScrollTrigger, Flip }
export default gsap
