import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** True when the user asked the OS to minimize non-essential motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/** True when the user asked for less data (Save-Data header / OS setting).
 *  Ambient RAF loops and decorative canvases should stay off in this mode. */
export function prefersReducedData(): boolean {
  if (typeof window === "undefined") return false
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection
  return (
    conn?.saveData === true ||
    window.matchMedia("(prefers-reduced-data: reduce)").matches
  )
}

/** Decorative motion is skipped for reduced-motion AND reduced-data users. */
export function allowAmbientMotion(): boolean {
  return !prefersReducedMotion() && !prefersReducedData()
}
