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
