'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'vityillo-theme'

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
})

export function useTheme() {
  return useContext(ThemeCtx)
}

/** Stored choice wins; otherwise follow the OS. Mirrors the inline
 *  bootstrap script in app/layout.tsx — keep the two in sync. */
function resolveInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* storage unavailable */ }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const t = resolveInitialTheme()
    // One-time hydration of theme from browser-only APIs after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(t)
    applyTheme(t)
  }, [])

  // Side effects live in the event handler, keeping the state updater pure
  // (Strict Mode double-invokes updaters) and only persisting explicit choices.
  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
  }, [theme])

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}
