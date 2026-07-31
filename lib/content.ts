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

const IMG = (name: string) => `/images/${name}.webp`

export type RoomKey = 'room1' | 'room2'

export const ROOM_MEDIA: Record<RoomKey, { slug: string; hero: string; gallery: string[] }> = {
  room1: {
    slug: 'felso-szint',
    hero: IMG('room-upper-hero'),
    gallery: [
      IMG('room-upper-hero'),
      IMG('room-upper-bed-window'),
      IMG('room-upper-stove-detail'),
      IMG('room-upper-alt-angle'),
    ],
  },
  room2: {
    slug: 'also-szint',
    hero: IMG('room-lower-hero'),
    gallery: [
      IMG('room-lower-hero'),
      IMG('room-lower-beds-wardrobe'),
      IMG('room-lower-beds-closeup'),
      IMG('room-lower-desk-window'),
    ],
  },
}

export const GALLERY_IMAGES: { src: string; alt: string; aspect: 'landscape' | 'portrait' }[] = [
  { src: IMG('forest-clearing-dawn'), alt: 'Erdős tisztás piknikasztalokkal a birtok mellett', aspect: 'portrait' },
  { src: IMG('house-exterior-day'), alt: 'A Vityilló Vendégház kívülről, üvegezett verandával', aspect: 'landscape' },
  { src: IMG('wellness-fireplace-corner'), alt: 'Kandallós pihenősarok a nappaliban', aspect: 'landscape' },
  { src: IMG('hot-tub-jets'), alt: 'Kültéri jakuzzi bugyogó vízzel napközben', aspect: 'landscape' },
  { src: IMG('room-upper-hero'), alt: 'Mester hálószoba magas gerendás tetőtérrel', aspect: 'portrait' },
  { src: IMG('kitchen-modern'), alt: 'Modern, világos konyha ívelt bejárattal', aspect: 'landscape' },
  { src: IMG('forest-path-driveway'), alt: 'Erdei ösvény a birtokhoz vezetve', aspect: 'landscape' },
  { src: IMG('living-room-cozy'), alt: 'Otthonos nappali szarvasmintás díszpárnákkal', aspect: 'landscape' },
  { src: IMG('bograc-panorama'), alt: 'Bográcsozó hely panorámás kilátással a völgyre', aspect: 'landscape' },
  { src: IMG('view-panorama-well'), alt: 'Panorámás kilátás a fenyvesre a teraszról', aspect: 'portrait' },
  { src: IMG('room-upper-stove-detail'), alt: 'Hangulatos hálószoba kandallóval', aspect: 'landscape' },
  { src: IMG('forest-path-misty'), alt: 'Ködös erdei ösvény kora reggel', aspect: 'landscape' },
]

/** Wide forest-birtok banner reused for subpage hero backgrounds. */
export const HERO_BANNER = IMG('hero-banner-wide')

export type AmenityKey = 'sauna' | 'pool' | 'forest' | 'lighting' | 'view' | 'ac' | 'tv' | 'kitchen' | 'grill'

/** Imagery paired by index with dict.testimonials.stories for the guest wall. */
export const STORY_IMAGES: string[] = [
  IMG('patio-lights-dusk'),
  IMG('dining-room-deer-art'),
  IMG('hot-tub-jets'),
  IMG('living-room-sunroom'),
  IMG('forest-path-misty'),
  IMG('bograc-panorama'),
  IMG('room-upper-hero'),
  IMG('house-exterior-day'),
]

/** Backdrops for the immersive experience scenes (and their static fallbacks). */
export const EXPERIENCE_SCENE_IMAGES: Record<ExperienceSlug, string> = {
  jacuzzi: IMG('hot-tub-full-view'),
  sauna: IMG('wellness-fireplace-corner'),
  bograc: IMG('bograc-cauldron-detail'),
  erdo: IMG('forest-clearing-alt'),
  vilagitas: IMG('patio-lights-dusk'),
  kilatas: IMG('view-panorama-well'),
  klima: IMG('ac-unit-room'),
  tv: IMG('tv-media-wall'),
  konyha: IMG('kitchen-modern-alt'),
}
