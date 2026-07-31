/**
 * Centralized media + structural content for Vityilló.
 * Text lives in dictionaries/*.json; this file holds image sources and
 * the keys that bind a card/section to its translated copy.
 *
 * Images are real photos of the property. All of them are served straight
 * from Supabase Storage (a public bucket, filenames "img (N).webp") — no
 * local copy is shipped. IMAGE_NUMBERS below is the one place that maps a
 * descriptive content key to the actual Supabase file number; it was built
 * by visually matching each numbered export to what it depicts. No sauna
 * or bathroom photo exists among the source photos — those slots use the
 * closest available real substitute (wellness/fireplace corner, living
 * room) rather than stock imagery.
 */

import type { ExperienceSlug } from '@/lib/nav'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET

if (!SUPABASE_URL || !SUPABASE_BUCKET) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_BUCKET - set both in .env.local (see .env.example). All site images are served from Supabase Storage.'
  )
}

/** Descriptive content key -> Supabase Storage file number ("img (N).webp"). */
const IMAGE_NUMBERS: Record<string, number> = {
  'room-upper-hero': 89,
  'room-upper-bed-window': 90,
  'room-upper-stove-detail': 85,
  'room-upper-alt-angle': 87,
  'room-lower-hero': 92,
  'room-lower-beds-wardrobe': 91,
  'room-lower-beds-closeup': 93,
  'room-lower-desk-window': 94,
  'forest-clearing-dawn': 15,
  'house-exterior-day': 25,
  'wellness-fireplace-corner': 86,
  'hot-tub-jets': 32,
  'kitchen-modern': 60,
  'living-room-cozy': 82,
  'bograc-panorama': 21,
  'view-panorama-well': 52,
  'forest-path-driveway': 16,
  'forest-path-misty': 19,
  'hero-banner-wide': 4,
  'house-exterior-portrait': 27,
  'hot-tub-full-view': 33,
  'bograc-cauldron-detail': 20,
  'forest-clearing-alt': 12,
  'patio-lights-dusk': 55,
  'ac-unit-room': 83,
  'tv-media-wall': 84,
  'kitchen-modern-alt': 70,
  'dining-room-deer-art': 56,
  'living-room-sunroom': 79,
  'cinematic-house-facade': 26,
  'forest-driveway-fence': 9,
  'forest-clearing-morning': 13,
  'kitchen-counter-detail': 66,
  'door-handle-detail': 73,
  'cabinet-detail': 77,
}

export const imageUrl = (name: string) => {
  const n = IMAGE_NUMBERS[name]
  if (!n) throw new Error(`lib/content.ts: no Supabase image number mapped for "${name}"`)
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/img%20(${n}).webp`
}

export type RoomKey = 'room1' | 'room2'

export const ROOM_MEDIA: Record<RoomKey, { slug: string; hero: string; gallery: string[] }> = {
  room1: {
    slug: 'felso-szint',
    hero: imageUrl('room-upper-hero'),
    gallery: [
      imageUrl('room-upper-hero'),
      imageUrl('room-upper-bed-window'),
      imageUrl('room-upper-stove-detail'),
      imageUrl('room-upper-alt-angle'),
    ],
  },
  room2: {
    slug: 'also-szint',
    hero: imageUrl('room-lower-hero'),
    gallery: [
      imageUrl('room-lower-hero'),
      imageUrl('room-lower-beds-wardrobe'),
      imageUrl('room-lower-beds-closeup'),
      imageUrl('room-lower-desk-window'),
    ],
  },
}

export const GALLERY_IMAGES: { src: string; alt: string; aspect: 'landscape' | 'portrait' }[] = [
  { src: imageUrl('forest-clearing-dawn'), alt: 'Erdős tisztás piknikasztalokkal a birtok mellett', aspect: 'portrait' },
  { src: imageUrl('house-exterior-day'), alt: 'A Vityilló Vendégház kívülről, üvegezett verandával', aspect: 'landscape' },
  { src: imageUrl('wellness-fireplace-corner'), alt: 'Kandallós pihenősarok a nappaliban', aspect: 'landscape' },
  { src: imageUrl('hot-tub-jets'), alt: 'Kültéri jakuzzi bugyogó vízzel napközben', aspect: 'landscape' },
  { src: imageUrl('room-upper-hero'), alt: 'Mester hálószoba magas gerendás tetőtérrel', aspect: 'portrait' },
  { src: imageUrl('kitchen-modern'), alt: 'Modern, világos konyha ívelt bejárattal', aspect: 'landscape' },
  { src: imageUrl('forest-path-driveway'), alt: 'Erdei ösvény a birtokhoz vezetve', aspect: 'landscape' },
  { src: imageUrl('living-room-cozy'), alt: 'Otthonos nappali szarvasmintás díszpárnákkal', aspect: 'landscape' },
  { src: imageUrl('bograc-panorama'), alt: 'Bográcsozó hely panorámás kilátással a völgyre', aspect: 'landscape' },
  { src: imageUrl('view-panorama-well'), alt: 'Panorámás kilátás a fenyvesre a teraszról', aspect: 'portrait' },
  { src: imageUrl('room-upper-stove-detail'), alt: 'Hangulatos hálószoba kandallóval', aspect: 'landscape' },
  { src: imageUrl('forest-path-misty'), alt: 'Ködös erdei ösvény kora reggel', aspect: 'landscape' },
]

/** Wide forest-birtok banner reused for subpage hero backgrounds. */
export const HERO_BANNER = imageUrl('hero-banner-wide')

export type AmenityKey = 'sauna' | 'pool' | 'forest' | 'lighting' | 'view' | 'ac' | 'tv' | 'kitchen' | 'grill'

/** Imagery paired by index with dict.testimonials.stories for the guest wall. */
export const STORY_IMAGES: string[] = [
  imageUrl('patio-lights-dusk'),
  imageUrl('dining-room-deer-art'),
  imageUrl('hot-tub-jets'),
  imageUrl('living-room-sunroom'),
  imageUrl('forest-path-misty'),
  imageUrl('bograc-panorama'),
  imageUrl('room-upper-hero'),
  imageUrl('house-exterior-day'),
]

/** Backdrops for the immersive experience scenes (and their static fallbacks). */
export const EXPERIENCE_SCENE_IMAGES: Record<ExperienceSlug, string> = {
  jacuzzi: imageUrl('hot-tub-full-view'),
  sauna: imageUrl('wellness-fireplace-corner'),
  bograc: imageUrl('bograc-cauldron-detail'),
  erdo: imageUrl('forest-clearing-alt'),
  vilagitas: imageUrl('patio-lights-dusk'),
  kilatas: imageUrl('view-panorama-well'),
  klima: imageUrl('ac-unit-room'),
  tv: imageUrl('tv-media-wall'),
  konyha: imageUrl('kitchen-modern-alt'),
}
