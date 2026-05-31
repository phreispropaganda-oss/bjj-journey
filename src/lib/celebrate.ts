'use client'

import confetti from 'canvas-confetti'

export function fireConfetti() {
  const end = Date.now() + 1500
  const colors = ['#9E0B13', '#DEFF9A', '#FFFFFF']
  ;(function frame() {
    confetti({
      particleCount: 6,
      angle:  60,
      spread: 55,
      origin: { x: 0 },
      colors,
    })
    confetti({
      particleCount: 6,
      angle:  120,
      spread: 55,
      origin: { x: 1 },
      colors,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

const KEY = 'belt_rise_celebrated_v1'
const LEGACY_KEY = 'michi_celebrated_sessions_v1'

/** Dispara confetti se este eh um marco (1, 10, 50, 100, 500) e ainda nao foi celebrado */
export function maybeCelebrate(totalSessions: number) {
  if (typeof window === 'undefined') return
  const milestones = [1, 10, 50, 100, 250, 500, 1000]
  if (!milestones.includes(totalSessions)) return
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY)
    if (localStorage.getItem(LEGACY_KEY) && !localStorage.getItem(KEY)) {
      localStorage.setItem(KEY, localStorage.getItem(LEGACY_KEY)!)
      localStorage.removeItem(LEGACY_KEY)
    }
    const set: number[] = raw ? JSON.parse(raw) : []
    if (set.includes(totalSessions)) return
    set.push(totalSessions)
    localStorage.setItem(KEY, JSON.stringify(set))
    fireConfetti()
  } catch { /* ignore */ }
}
