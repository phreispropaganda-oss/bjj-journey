'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

interface ConfirmOptions {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return ctx
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { open: boolean }) | null>(null)
  const resolverRef = useRef<((b: boolean) => void) | null>(null)
  useBodyScrollLock(!!state?.open)

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve
      setState({ ...opts, open: true })
    })
  }, [])

  function resolve(answer: boolean) {
    resolverRef.current?.(answer)
    resolverRef.current = null
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state?.open && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-end sm:items-center justify-center px-4 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && resolve(false)}>
          <div className="bg-brand-surface w-full max-w-sm rounded-3xl p-5 border border-brand-elev"
            style={{ animation: 'fadeUp 0.2s ease' }}>
            <h2 className="font-display text-ink-primary text-lg mb-1.5">{state.title}</h2>
            {state.body && <p className="text-ink-secondary text-sm mb-5">{state.body}</p>}
            <div className="flex gap-2">
              <button onClick={() => resolve(false)}
                className="flex-1 bg-brand-elev text-ink-secondary font-black py-3 rounded-full text-sm">
                {state.cancelLabel ?? 'Cancelar'}
              </button>
              <button onClick={() => resolve(true)}
                className={`flex-1 font-black py-3 rounded-full text-sm ${
                  state.destructive
                    ? 'bg-blood text-ink-primary'
                    : 'bg-volt text-brand-bg'
                }`}>
                {state.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
