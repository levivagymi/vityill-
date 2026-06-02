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
