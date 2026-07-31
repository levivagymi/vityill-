// One-off pipeline: resize + convert the selected real property photos from
// images/ (raw 45-67MB camera exports) into compressed WebP files under
// public/images/, so Next's image optimizer has a reasonably-sized source to
// work from. Re-run if the mapping below changes or source photos are replaced.
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC_DIR = path.join(ROOT, 'images')
const OUT_DIR = path.join(ROOT, 'public', 'images')

const MAX_DIMENSION = 2400
const QUALITY = 80

// [sourceNumber, destinationName]
const MAPPING = [
  [193, 'room-upper-hero'],
  [191, 'room-upper-bed-window'],
  [196, 'room-upper-stove-detail'],
  [197, 'room-upper-alt-angle'],
  [203, 'room-lower-hero'],
  [208, 'room-lower-beds-wardrobe'],
  [212, 'room-lower-beds-closeup'],
  [214, 'room-lower-desk-window'],
  [11, 'forest-clearing-dawn'],
  [108, 'house-exterior-day'],
  [187, 'wellness-fireplace-corner'],
  [74, 'hot-tub-jets'],
  [157, 'kitchen-modern'],
  [172, 'living-room-cozy'],
  [43, 'bograc-panorama'],
  [114, 'view-panorama-well'],
  [26, 'forest-path-driveway'],
  [4, 'forest-path-misty'],
  [115, 'hero-banner-wide'],
  [90, 'house-exterior-portrait'],
  [88, 'hot-tub-full-view'],
  [36, 'bograc-cauldron-detail'],
  [13, 'forest-clearing-alt'],
  [100, 'patio-lights-dusk'],
  [216, 'ac-unit-room'],
  [179, 'tv-media-wall'],
  [158, 'kitchen-modern-alt'],
  [128, 'dining-room-deer-art'],
  [169, 'living-room-sunroom'],
  [119, 'cinematic-house-facade'],
  [21, 'forest-driveway-fence'],
  [12, 'forest-clearing-morning'],
  [155, 'kitchen-counter-detail'],
  [180, 'door-handle-detail'],
  [167, 'cabinet-detail'],
]

await mkdir(OUT_DIR, { recursive: true })

for (const [sourceNumber, destName] of MAPPING) {
  const srcPath = path.join(SRC_DIR, `szomód_vityilló-${sourceNumber}.png`)
  const outPath = path.join(OUT_DIR, `${destName}.webp`)
  await sharp(srcPath)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(outPath)
  console.log(`${sourceNumber} -> ${destName}.webp`)
}

console.log(`Done. ${MAPPING.length} images written to ${OUT_DIR}`)
