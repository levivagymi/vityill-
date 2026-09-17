import {
  Wifi, Wind, ThermometerSun, Sparkles, ShowerHead, TowelRack, Tv, PlugZap, WashingMachine,
} from 'lucide-react'
import type { RoomAmenityKey } from '@/lib/content'

const ROOM_AMENITY_ICONS: Record<RoomAmenityKey, React.ElementType> = {
  wifi: Wifi,
  ac: Wind,
  heating: ThermometerSun,
  hairdryer: Sparkles,
  bathroom: ShowerHead,
  linens: TowelRack,
  smarttv: Tv,
  charging: PlugZap,
  dishwasher: WashingMachine,
}

const ROOM_AMENITY_KEYS: RoomAmenityKey[] = [
  'wifi', 'ac', 'heating', 'hairdryer', 'bathroom', 'linens', 'smarttv', 'charging', 'dishwasher',
]

/**
 * Room-scoped, purely informational amenity grid (not clickable — unlike the
 * house-level `Amenities` section, which links out to `/elmenyek/*`). Same
 * 9 facts apply to both rooms, so the caller passes one shared dict object.
 */
export default function RoomAmenities({
  title,
  items,
}: {
  title: string
  items: Record<RoomAmenityKey, { name: string; desc: string }>
}) {
  return (
    <div>
      <h3 className="font-heading text-xl mb-5">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROOM_AMENITY_KEYS.map((key) => {
          const Icon = ROOM_AMENITY_ICONS[key]
          const item = items[key]
          return (
            <div
              key={key}
              className="bg-card border border-foreground/[0.07] rounded-2xl p-5"
            >
              <div className="w-10 h-10 rounded-xl bg-foreground/[0.06] border border-foreground/10 flex items-center justify-center mb-4">
                <Icon size={18} className="text-foreground" />
              </div>
              <h4 className="font-heading text-base mb-1.5">{item.name}</h4>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
