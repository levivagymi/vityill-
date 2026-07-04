'use client'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { CommandOpenContext } from '@/components/command/command-context'

// The palette ships in its own chunk, requested at idle (or on first open),
// so it never weighs on the initial bundle.
const CommandPalette = dynamic(() => import('@/components/command/CommandPalette'), {
  ssr: false,
})

const TYPING_SELECTOR = 'input, textarea, select, [contenteditable="true"]'

export default function CommandProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  // Global keybinds: ⌘/Ctrl+K toggles anywhere, '/' opens when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setReady(true)
        setOpen((o) => !o)
        return
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as Element | null
        if (target?.closest(TYPING_SELECTOR)) return
        e.preventDefault()
        setReady(true)
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Fetch the chunk during idle time so the first ⌘K feels instant.
  useEffect(() => {
    const idle = (cb: () => void) =>
      'requestIdleCallback' in window
        ? requestIdleCallback(cb, { timeout: 4000 })
        : setTimeout(cb, 2500)
    const id = idle(() => setReady(true))
    return () => {
      if ('cancelIdleCallback' in window) cancelIdleCallback(id as number)
      else clearTimeout(id as ReturnType<typeof setTimeout>)
    }
  }, [])

  const value = useMemo(() => ({ open, setOpen }), [open])

  return (
    <CommandOpenContext.Provider value={value}>
      {children}
      {ready && <CommandPalette />}
    </CommandOpenContext.Provider>
  )
}
