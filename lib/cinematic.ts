/** Persists across visits — gates whether the cinematic intro renders at all. */
export const CINEMATIC_STORAGE_KEY = 'hasWatchedCinematic'

/** Set by the rewatch button for exactly one reload. The cinematic costs ~8 MB
 *  of video plus a pinned, scrubbed GSAP timeline, so lite mode skips it by
 *  default (lib/fx.ts) — but a visitor who asks for it by name gets it. */
export const CINEMATIC_FORCE_KEY = 'cinematic-force'
