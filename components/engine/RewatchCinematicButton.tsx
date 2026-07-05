'use client'
import { RotateCcw } from 'lucide-react'
import { useDict } from '@/components/providers/DictProvider'
import { CINEMATIC_STORAGE_KEY } from '@/lib/cinematic'

export default function RewatchCinematicButton() {
  const dict = useDict()

  const handleClick = () => {
    try { localStorage.setItem(CINEMATIC_STORAGE_KEY, 'false') } catch { /* ignore */ }
    window.location.reload()
  }

  return (
    <button
      onClick={handleClick}
      data-cursor="view"
      className="fixed top-24 right-4 sm:right-6 z-40 flex items-center gap-2 rounded-full border border-foreground/10 bg-background/90 backdrop-blur-md px-4 py-2 font-sans text-xs text-foreground/70 shadow-lg shadow-black/10 transition-all duration-200 hover:text-foreground hover:bg-background cursor-pointer"
    >
      <RotateCcw size={14} aria-hidden />
      {dict.cinematic.rewatchBtn}
    </button>
  )
}
