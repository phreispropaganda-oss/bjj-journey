'use client'

import { useEffect } from 'react'

/**
 * Trava o scroll do body enquanto um modal/sheet estiver aberto.
 * Importante para iOS Safari onde overlays fixed deixam o body "vazar" scroll.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const scrollY = window.scrollY
    const original = {
      position: document.body.style.position,
      top:      document.body.style.top,
      width:    document.body.style.width,
      overflow: document.body.style.overflow,
    }
    document.body.style.position = 'fixed'
    document.body.style.top      = `-${scrollY}px`
    document.body.style.width    = '100%'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = original.position
      document.body.style.top      = original.top
      document.body.style.width    = original.width
      document.body.style.overflow = original.overflow
      window.scrollTo(0, scrollY)
    }
  }, [active])
}
