import {
  ChefHat, CookingPot, Flame, Lightbulb, Mountain, Trees, Tv, Waves, Wind,
  type LucideIcon,
} from 'lucide-react'
import type { ExperienceSlug } from '@/lib/nav'

/** Single growth point for the experience icon set — consumed by the command
 *  palette and the /elmenyek index. */
export const EXPERIENCE_ICONS: Record<ExperienceSlug, LucideIcon> = {
  jacuzzi: Waves,
  sauna: Flame,
  bograc: CookingPot,
  erdo: Trees,
  vilagitas: Lightbulb,
  kilatas: Mountain,
  klima: Wind,
  tv: Tv,
  konyha: ChefHat,
}
