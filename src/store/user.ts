import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BeltId } from '@/lib/supabase/types'

interface UserStore {
  beltId: BeltId
  degrees: number
  xp: number
  streak: number
  setBelt: (beltId: BeltId, degrees: number) => void
  addXP: (amount: number) => number
  setStreak: (streak: number) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      beltId: 'white',
      degrees: 0,
      xp: 0,
      streak: 0,
      setBelt(beltId, degrees) { set({ beltId, degrees }) },
      addXP(amount) { const newXP = get().xp + amount; set({ xp: newXP }); return newXP },
      setStreak(streak) { set({ streak }) },
    }),
    { name: 'bjk-user' }
  )
)

export function getXPLevel(xp: number) { return Math.floor(xp / 500) + 1 }
export function getXPProgress(xp: number) { const l = getXPLevel(xp); return ((xp - (l-1)*500) / 500) * 100 }
