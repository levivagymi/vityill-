import type { Dictionary } from '@/lib/types'

export type BlueprintLabels = Dictionary['cinematic']['blueprint']

/**
 * Stage colour behind the drawing. Exported so CinematicStory's `.ph4-layer`
 * background and the bed silhouettes that occlude the upstairs bathroom are
 * driven by the same literal — if they drift, the depth trick shows a seam.
 */
export const BLUEPRINT_BG = '#020609'

// viewBox: content spans x 20..1200, y 88..452 — the ~30u margin on every side
// keeps the 2.4-wide strokes and the drop-shadow glow off the clip edge.
const VIEW_W = 1220
const VIEW_H = 428
const ASPECT = VIEW_W / VIEW_H

const TIER = {
  structure: { stroke: 'rgba(120,188,255,.92)', width: 2.4 },
  detail:    { stroke: 'rgba(100,168,255,.65)', width: 1.5 },
  ghost:     { stroke: 'rgba(100,168,255,.34)', width: 1.2 },
} as const

type Tier = keyof typeof TIER
type Stroke = { d: string; t: Tier; fill?: boolean }

// Upper-floor single bed: open-bottom silhouette standing on the floor slab
// (y=314), mattress line, pillow. The silhouette carries fill=BLUEPRINT_BG so
// it masks the bathroom drawn behind it — the fill adds alpha only *inside* the
// existing stroke boundary, so the svg-level drop-shadow is unchanged.
const singleBed = (x: number): Stroke[] => [
  { d: `M ${x} 314 L ${x} 254 L ${x + 132} 254 L ${x + 132} 314`, t: 'detail', fill: true },
  { d: `M ${x} 272 L ${x + 132} 272`, t: 'detail' },
  { d: `M ${x + 9} 258 L ${x + 49} 258 L ${x + 49} 270 L ${x + 9} 270 Z`, t: 'detail' },
]

const stairTread = (y: number): Stroke => ({ d: `M 1080 ${y} L 1170 ${y}`, t: 'detail' })

// Cross-section through the property: jacuzzi shelter (left) and the two-storey
// main house (right) on a shared ground line at y=452.
const STROKES: Stroke[] = [
  // ── Shell ────────────────────────────────────────────────────────────────
  { d: 'M 20 452 L 1200 452', t: 'structure' },                      // ground
  { d: 'M 100 452 L 100 214 L 390 214 L 390 452', t: 'structure' },  // jacuzzi posts + canopy
  { d: 'M 92 206 L 398 206', t: 'structure' },                       // canopy slab depth
  { d: 'M 470 452 L 470 190 L 1050 190 L 1050 452', t: 'structure' },// main house walls
  { d: 'M 446 190 L 760 88 L 1074 190', t: 'structure' },            // gable roof
  { d: 'M 470 314 L 1050 314', t: 'structure' },                     // floor slab

  // ── Jacuzzi shelter ──────────────────────────────────────────────────────
  { d: 'M 128 452 L 128 348 L 292 348 L 292 452', t: 'detail' },     // tub
  { d: 'M 140 368 L 280 368', t: 'detail' },                         // water line
  { d: 'M 322 452 L 322 330 L 378 330 L 378 452', t: 'detail' },     // shower enclosure
  { d: 'M 350 330 L 350 344', t: 'detail' },                         // shower stem
  { d: 'M 336 344 L 364 344', t: 'detail' },                         // shower head
  { d: 'M 341 352 L 339 366', t: 'detail' },
  { d: 'M 350 352 L 350 370', t: 'detail' },
  { d: 'M 359 352 L 361 366', t: 'detail' },

  // ── Ground floor: partitions ─────────────────────────────────────────────
  { d: 'M 670 452 L 670 314', t: 'detail' },
  { d: 'M 900 452 L 900 314', t: 'detail' },

  // ── Ground floor: double bedroom (470–670) ───────────────────────────────
  { d: 'M 508 452 L 508 396 L 632 396 L 632 452', t: 'detail' },
  { d: 'M 508 412 L 632 412', t: 'detail' },
  { d: 'M 517 400 L 561 400 L 561 410 L 517 410 Z', t: 'detail' },
  { d: 'M 579 400 L 623 400 L 623 410 L 579 410 Z', t: 'detail' },

  // ── Ground floor: kitchen (670–900), semicircular vault ──────────────────
  { d: 'M 685 414 A 100 100 0 0 1 885 414', t: 'detail' },           // apex lands on the slab
  { d: 'M 685 414 L 685 452', t: 'detail' },
  { d: 'M 885 414 L 885 452', t: 'detail' },
  { d: 'M 745 452 L 745 420 L 825 420 L 825 452', t: 'detail' },     // counter
  { d: 'M 785 420 L 785 452', t: 'detail' },

  // ── Ground floor: bathroom (900–1050) ────────────────────────────────────
  { d: 'M 916 452 L 916 388 L 956 388 L 956 452', t: 'detail' },     // shower stall
  { d: 'M 936 388 L 936 400', t: 'detail' },
  { d: 'M 926 400 L 946 400', t: 'detail' },
  { d: 'M 972 404 L 996 404 L 996 422 L 972 422 Z', t: 'detail' },   // wc cistern
  // Two arcs, never one: a single A whose start and end coincide is dropped
  // by the spec, which would silently strip this shape from the draw-in.
  { d: 'M 972 436 A 12 14 0 0 1 996 436 A 12 14 0 0 1 972 436', t: 'detail' },
  { d: 'M 1012 414 L 1040 414 L 1036 430 L 1016 430 Z', t: 'detail' },
  { d: 'M 1026 414 L 1026 402 L 1018 402', t: 'detail' },            // tap
  { d: 'M 1026 430 L 1026 452', t: 'detail' },                       // waste

  // ── External staircase ───────────────────────────────────────────────────
  { d: 'M 1050 314 L 1178 314', t: 'detail' },                       // landing
  { d: 'M 1080 452 L 1080 314', t: 'detail' },
  { d: 'M 1170 452 L 1170 314', t: 'detail' },
  ...[434, 416, 398, 380, 362, 344, 326].map(stairTread),
  { d: 'M 1034 314 L 1034 258 L 1050 258', t: 'detail' },            // upper door jamb

  // ── Upper floor: bathroom, dead centre of the room and BEHIND the beds ───
  // Drawn before the beds so their fill cuts it off at y=254. The walls sit at
  // 600/920 — well inside beds 1 and 3 rather than flush with bed 2's edge — so
  // they visibly disappear *into* a bed whose own outline carries on past them.
  // That overlap is the whole depth cue; flush edges just read as "box ends here".
  { d: 'M 600 314 L 600 206', t: 'ghost' },
  { d: 'M 920 314 L 920 206', t: 'ghost' },
  { d: 'M 600 206 L 920 206', t: 'ghost' },

  // ── Upper floor: three single beds ───────────────────────────────────────
  ...singleBed(504),
  ...singleBed(694),
  ...singleBed(884),

  // ── North / scale mark ───────────────────────────────────────────────────
  { d: 'M 70 148 L 70 172', t: 'detail' },
  { d: 'M 58 160 L 82 160', t: 'detail' },
]

// A 2.85:1 section is ~343px wide at a 375px viewport (≈0.28 scale), where no
// type size is both legible and narrow enough to stay inside the room it names —
// scaled up to read, FRANCIAÁGY alone overruns the bedroom into the kitchen. So
// labels drop out by tier as space runs out rather than shrinking uniformly.
// clamp()+vw cannot substitute: lengths inside a viewBox resolve to user units,
// and vw grows with the viewport — exactly backwards.
const LABEL_SIZE = {
  anchor:    'text-[26px] sm:text-[20px] lg:text-[15px]',
  primary:   'hidden sm:inline sm:text-[18px] lg:text-[15px]',
  secondary: 'hidden lg:inline lg:text-[12px]',
} as const

const LABELS: { k: keyof BlueprintLabels; x: number; y: number; s: keyof typeof LABEL_SIZE }[] = [
  { k: 'jacuzzi',     x:  210, y: 412, s: 'anchor'    },
  { k: 'kitchen',     x:  785, y: 372, s: 'anchor'    },
  { k: 'bath',        x:  760, y: 236, s: 'anchor'    },
  { k: 'shower',      x:  350, y: 318, s: 'primary'   },
  { k: 'doubleBed',   x:  570, y: 380, s: 'primary'   },
  { k: 'bath',        x:  975, y: 372, s: 'primary'   },
  { k: 'stairs',      x: 1125, y: 300, s: 'primary'   },
  { k: 'jacuzziRoof', x:  245, y: 238, s: 'secondary' },
  // Inside the beds, below the mattress line — above them they would collide
  // with the upstairs bathroom label sitting at the room's centre.
  { k: 'singleBed',   x:  570, y: 296, s: 'secondary' },
  { k: 'singleBed',   x:  760, y: 296, s: 'secondary' },
  { k: 'singleBed',   x:  950, y: 296, s: 'secondary' },
]

/**
 * Wireframe cross-section of the property, drawn as a blueprint.
 *
 * Every stroke carries `pathLength={1}`, so a draw-in is just
 * `strokeDasharray: 1 → strokeDashoffset: 1 → 0` with no `getTotalLength()`
 * measurement and no arc-precision caveats. Pass `pathClassName` to give the
 * animator a handle on the strokes and `labelClassName` on the captions.
 */
export default function HouseBlueprint({
  pathClassName = '', labelClassName = '', labels, className = '',
}: {
  pathClassName?: string
  labelClassName?: string
  labels: BlueprintLabels
  className?: string
}) {
  return (
    <svg
      viewBox={`0 56 ${VIEW_W} ${VIEW_H}`}
      className={`h-auto ${className}`}
      style={{
        width: `min(100%, 1120px, calc(56lvh * ${ASPECT.toFixed(3)}))`,
        filter: 'drop-shadow(0 0 8px rgba(100,180,255,.38))',
      }}
      aria-hidden="true"
    >
      {STROKES.map((s, i) => (
        <path key={i}
          className={pathClassName}
          d={s.d}
          pathLength={1}
          fill={s.fill ? BLUEPRINT_BG : 'none'}
          stroke={TIER[s.t].stroke}
          strokeWidth={TIER[s.t].width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {/* Captions last: they must paint over the bed fills that mask the bathroom. */}
      {LABELS.map((l, i) => (
        <text key={i}
          className={`font-sans ${LABEL_SIZE[l.s]} ${labelClassName}`}
          x={l.x} y={l.y}
          textAnchor="middle"
          letterSpacing="0.08em"
          fill="rgba(100,180,255,.62)"
        >
          {labels[l.k]}
        </text>
      ))}
    </svg>
  )
}
