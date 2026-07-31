/**
 * Centralized media + structural content for Vityilló.
 * Text lives in dictionaries/*.json; this file holds image sources and
 * the keys that bind a card/section to its translated copy.
 *
 * Images are real photos of the property, optimized (resized + WebP) by
 * scripts/optimize-images.mjs from the raw sources in images/ into
 * public/images/. No sauna or bathroom photo exists among the source
 * photos — those slots use the closest available real substitute
 * (wellness/fireplace corner, living room) rather than stock imagery.
 */

import type { ExperienceSlug } from '@/lib/nav'

export const imageUrl = (name: string) => `/images/${name}.webp`

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
