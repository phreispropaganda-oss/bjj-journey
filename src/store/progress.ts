import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProgressStore {
  completed: Record<string, boolean>
  toggle: (key: string) => void
  isCompleted: (key: string) => boolean
  getCount: (beltId: string, moduleId: string) => number
  setCompleted: (keys: string[]) => void
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      completed: {},
      toggle(key) {
        set(s => ({ completed: { ...s.completed, [key]: !s.completed[key] } }))
      },
      isCompleted(key) { return !!get().completed[key] },
      getCount(beltId, moduleId) {
        const prefix = `${beltId}-${moduleId}-`
        return Object.entries(get().completed).filter(([k, v]) => k.startsWith(prefix) && v).length
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
