'use client'
import { createContext, useContext } from 'react'
import type { Dictionary } from '@/lib/types'

const DictContext = createContext<Dictionary | null>(null)

export function DictProvider({ dict, children }: { dict: Dictionary; children: React.ReactNode }) {
  return <DictContext.Provider value={dict}>{children}</DictContext.Provider>
}

export function useDict(): Dictionary {
  const ctx = useContext(DictContext)
  if (!ctx) throw new Error('useDict must be used within DictProvider')
  return ctx
}
