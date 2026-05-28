import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProgressStore {
  completed: Record<string, boolean>
  toggle: (key: string) => void
  isCompleted: (key: string) => boolean
  getCount: (beltId: string, moduleId: string) => number
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      completed: {},
      toggle(key) { set(s => ({ completed: { ...s.completed, [key]: !s.completed[key] } })) },
      isCompleted(key) { return !!get().completed[key] },
      getCount(beltId, moduleId) {
        const prefix = `${beltId}-${moduleId}-`
        return Object.entries(get().completed).filter(([k,v]) => k.startsWith(prefix) && v).length
      },
    }),
    { name: 'bjp-progress' }
  )
)
