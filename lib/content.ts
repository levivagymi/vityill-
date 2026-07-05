/**
 * Centralized media + structural content for Vityilló.
 * Text lives in dictionaries/*.json; this file holds image sources and
 * the keys that bind a card/section to its translated copy.
 */

const U = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&fit=crop`

export type RoomKey = 'room1' | 'room2'

export const ROOM_MEDIA: Record<RoomKey, { slug: string; hero: string; gallery: string[] }> = {
  room1: {
    slug: 'felso-szint',
    hero: U('photo-1631049307264-da0ec9d70304', 1400),
    gallery: [
      U('photo-1631049307264-da0ec9d70304'),
      U('photo-1522771739844-6a9f6d5f14af'),
      U('photo-1586105251261-72a756497a11'),
      U('photo-1505693416388-ac5ce068fe85'),
    ],
  },
  room2: {
    slug: 'also-szint',
    hero: U('photo-1505691938895-1758d7feb511', 1400),
    gallery: [
      U('photo-1505691938895-1758d7feb511'),
      U('photo-1560185007-cde436f6a4d0'),
      U('photo-1611892440504-42a792e24d32'),
      U('photo-1556020685-ae41abfc9365'),
    ],
  },
}

export type ExperienceKey = 'sauna' | 'pool' | 'grill' | 'forest'

export const EXPERIENCES: { key: ExperienceKey; image: string }[] = [
  { key: 'sauna', image: U('photo-1540555700478-4be289fbecef', 1400) },
  { key: 'pool', image: U('photo-1571896349842-33c89424de2d', 1400) },
  { key: 'grill', image: U('photo-1504204267155-aaad8e81290d', 1400) },
  { key: 'forest', image: U('photo-1472214103451-9374bd1c798e', 1400) },
]

export const GALLERY_IMAGES: { src: string; alt: string; aspect: 'landscape' | 'portrait' }[] = [
  { src: U('photo-1448375240586-882707db888b'), alt: 'Erdő hajnalban', aspect: 'landscape' },
  { src: U('photo-1510798831971-661eb04b3739'), alt: 'A vendégház kívülről', aspect: 'portrait' },
  { src: U('photo-1540555700478-4be289fbecef'), alt: 'Szauna belső tér', aspect: 'portrait' },
  { src: U('photo-1571896349842-33c89424de2d'), alt: 'Kültéri medence', aspect: 'landscape' },
  { src: U('photo-1631049307264-da0ec9d70304'), alt: 'Mester hálószoba', aspect: 'portrait' },
  { src: U('photo-1484154218962-a197022b5858'), alt: 'Modern konyha', aspect: 'landscape' },
  { src: U('photo-1472214103451-9374bd1c798e'), alt: 'Erdei ösvény', aspect: 'landscape' },
  { src: U('photo-1586105251261-72a756497a11'), alt: 'Fürdőszoba', aspect: 'portrait' },
  { src: U('photo-1504204267155-aaad8e81290d'), alt: 'Bográcsos tűzhely', aspect: 'landscape' },
  { src: U('photo-1501854140801-50d01698950b'), alt: 'Erdő madártávlatból', aspect: 'landscape' },
  { src: U('photo-1505691938895-1758d7feb511'), alt: 'Hangulatos hálószoba', aspect: 'portrait' },
  { src: U('photo-1518780664697-55e3ad937233'), alt: 'Ködös erdei reggel', aspect: 'landscape' },
]

/** Wide forest banner reused for subpage hero backgrounds. */
export const HERO_BANNER = U('photo-1448375240586-882707db888b', 1920)

export type AmenityKey = 'sauna' | 'pool' | 'forest' | 'lighting' | 'view' | 'ac' | 'tv' | 'kitchen' | 'grill'

/** Hero imagery for each amenity detail subpage; falls back to HERO_BANNER where no distinct shot exists. */
export const AMENITY_IMAGES: Record<AmenityKey, string> = {
  sauna: U('photo-1540555700478-4be289fbecef', 1920),
  pool: U('photo-1571896349842-33c89424de2d', 1920),
  forest: U('photo-1472214103451-9374bd1c798e', 1920),
  lighting: U('photo-1505691938895-1758d7feb511', 1920),
  view: U('photo-1501854140801-50d01698950b', 1920),
  ac: HERO_BANNER,
  tv: HERO_BANNER,
  kitchen: U('photo-1484154218962-a197022b5858', 1920),
  grill: U('photo-1504204267155-aaad8e81290d', 1920),
}

/** Imagery paired by index with dict.testimonials.stories for the guest wall. */
export const STORY_IMAGES: string[] = [
  U('photo-1540555700478-4be289fbecef', 640),
  U('photo-1472214103451-9374bd1c798e', 640),
  U('photo-1448375240586-882707db888b', 640),
  U('photo-1504204267155-aaad8e81290d', 640),
  U('photo-1501854140801-50d01698950b', 640),
  U('photo-1571896349842-33c89424de2d', 640),
  U('photo-1631049307264-da0ec9d70304', 640),
  U('photo-1510798831971-661eb04b3739', 640),
]

/** Backdrops for the immersive experience scenes (and their static fallbacks). */
export const EXPERIENCE_SCENE_IMAGES: Record<'jacuzzi' | 'sauna' | 'bograc', string> = {
  jacuzzi: U('photo-1571896349842-33c89424de2d', 1920),
  sauna: U('photo-1540555700478-4be289fbecef', 1920),
  bograc: U('photo-1504204267155-aaad8e81290d', 1920),
}
