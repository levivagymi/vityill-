'use client'
import { RotateCcw } from 'lucide-react'
import { useDict } from '@/components/providers/DictProvider'
import { CINEMATIC_STORAGE_KEY, CINEMATIC_FORCE_KEY, CINEMATIC_PROMPT_SEEN_KEY } from '@/lib/cinematic'

export default function RewatchCinematicButton() {
  const dict = useDict()

  const handleClick = () => {
    try {
      localStorage.setItem(CINEMATIC_STORAGE_KEY, 'false')
      // Explicit opt-in, honoured for this one reload: on a device the effects
      // budget put in lite mode the gate would otherwise skip straight past the
      // cinematic again and the button would look broken.
      sessionStorage.setItem(CINEMATIC_FORCE_KEY, '1')
      // The choice prompt gates itself per tab session — without clearing this
      // too, "rewatch" would replay the story but silently skip the prompt.
      sessionStorage.removeItem(CINEMATIC_PROMPT_SEEN_KEY)
    } catch { /* ignore */ }
    window.location.reload()
  }

  return (
    <button
      onClick={handleClick}
      data-cursor="view"
      className="fixed top-24 right-4 sm:right-6 z-40 flex items-center gap-2 rounded-full border border-foreground/10 bg-background/90 backdrop-blur-md px-4 py-2 font-sans text-xs text-foreground shadow-lg shadow-black/10 transition-all duration-200 hover:text-foreground hover:bg-background cursor-pointer"
    >
      <RotateCcw size={14} aria-hidden />
      {dict.cinematic.rewatchBtn}
    </button>
  )
}
