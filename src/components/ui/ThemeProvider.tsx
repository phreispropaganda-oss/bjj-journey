'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeCtx {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  resolved: 'light' | 'dark'
}

const Ctx = createContext<ThemeCtx | null>(null)

const STORAGE_KEY = 'belt_rise_theme'

function getSystem(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function apply(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', resolved)
  document.documentElement.style.colorScheme = resolved
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark')
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark')

  // Mount: restaurar do localStorage
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system'
    setModeState(stored)
  }, [])

  // Mode → resolved
  useEffect(() => {
    const r = mode === 'system' ? getSystem() : mode
    setResolved(r)
    apply(r)
  }, [mode])

  // Listen system mudancas quando mode=system
  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      const r = mq.matches ? 'light' : 'dark'
      setResolved(r); apply(r)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  function setMode(m: ThemeMode) {
    setModeState(m)
    localStorage.setItem(STORAGE_KEY, m)
  }

  return <Ctx.Provider value={{ mode, setMode, resolved }}>{children}</Ctx.Provider>
}

export function useTheme() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTheme requer <ThemeProvider>')
  return v
}
