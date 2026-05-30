import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProgressStore {
  completed: Record<string, boolean>
  toggle: (key: string) => void
  isCompleted: (key: string) => boolean
  getCount: (beltId: string, moduleId: string) => number
  /** Substitui as completions de uma faixa pelas keys fornecidas. Remove o que nao veio do servidor. */
  setCompletedForBelt: (beltId: string, keys: string[]) => void
  /** @deprecated use setCompletedForBelt para garantir sincronia */
  setCompleted: (keys: string[]) => void
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      completed: {},
      toggle(key) {
        set(s => {
          const next = { ...s.completed }
          if (next[key]) delete next[key]
          else next[key] = true
          return { completed: next }
        })
      },
      isCompleted(key) { return !!get().completed[key] },
      getCount(beltId, moduleId) {
        const prefix = `${beltId}-${moduleId}-`
        return Object.entries(get().completed).filter(([k, v]) => k.startsWith(prefix) && v).length
      },
      setCompletedForBelt(beltId, keys) {
        set(s => {
          const prefix = `${beltId}-`
          const next: Record<string, boolean> = {}
          for (const [k, v] of Object.entries(s.completed)) {
            if (!k.startsWith(prefix)) next[k] = v
          }
          for (const k of keys) next[k] = true
          return { completed: next }
        })
      },
      setCompleted(keys) {
        const patch: Record<string, boolean> = {}
        keys.forEach(k => { patch[k] = true })
        set(s => ({ completed: { ...s.completed, ...patch } }))
      },
    }),
    { name: 'bjj-progress' }
  )
)
