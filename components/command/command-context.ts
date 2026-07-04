'use client'
import { createContext, useContext } from 'react'

/**
 * Open/close state for the command palette. Lives in its own module so
 * CommandProvider (which lazy-loads the palette) and CommandPalette (which
 * reads the state) don't import each other — no cycle in the module graph.
 */
export const CommandOpenContext = createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({ open: false, setOpen: () => {} })

export function useCommand() {
  return useContext(CommandOpenContext)
}
