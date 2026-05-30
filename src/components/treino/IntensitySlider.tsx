'use client'

import { useEffect, useRef, useState } from 'react'

// PRD §2.2 — Slider 1-10 com cor interpolada e haptic feedback
// Web: navigator.vibrate (Android). iOS Safari ignora — fallback visual.

interface Props {
  value: number | null
  onChange: (v: number) => void
}

const LABELS = ['', 'Leve', 'Aquecido', 'OK', 'Forte', 'Intenso',
                'Pesado', 'Brutal', 'Lendário', 'Limite', 'WAR ZONE']

// Cor interpolada de #1C1C1E -> #9E0B13 baseada em value/10
function colorFor(v: number): string {
  if (v < 1) return '#1C1C1E'
  const t = (v - 1) / 9
  const r = Math.round(28  + (158 - 28)  * t)
  const g = Math.round(28  + (11  - 28)  * t)
  const b = Math.round(30  + (19  - 30)  * t)
  return `rgb(${r},${g},${b})`
}

export default function IntensitySlider({ value, onChange }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const lastVibrated = useRef<number>(-1)

  const display = value ?? hover ?? 0
  const isWarZone = display === 10

  // Haptic feedback
  useEffect(() => {
    if (value === null || value === lastVibrated.current) return
    lastVibrated.current = value
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (value === 10) navigator.vibrate([40, 30, 40, 30, 80])
      else navigator.vibrate(15)
    }
  }, [value])

  return (
    <div className="space-y-3">
      {/* Display do valor */}
      <div className="flex items-end justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-ink-secondary">
          Esforço percebido
        </span>
        <div className="text-right">
          <span className="font-display text-3xl leading-none"
            style={{ color: display === 0 ? 'var(--text-muted)' : colorFor(display) }}>
            {display === 0 ? '–' : display}
          </span>
          {display > 0 && (
            <span className={`block text-[10px] font-black mt-1 ${isWarZone ? 'text-volt animate-pulse' : 'text-ink-muted'}`}>
              {LABELS[display]}
            </span>
          )}
        </div>
      </div>

      {/* Trilha de 10 bolinhas grandes (tap-target 44px+) */}
      <div className="flex items-center justify-between gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const isActive = value !== null && n <= value
          const isCurrent = value === n
          return (
            <button key={n}
              type="button"
              onClick={() => onChange(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(null)}
              aria-label={`Esforço ${n} de 10`}
              className="relative flex-1 min-h-tap rounded-lg flex items-center justify-center transition-all
                active:scale-90"
              style={{
                background: isActive ? colorFor(n) : 'var(--surface-2)',
                border: isCurrent ? '2px solid var(--volt)' : '1px solid var(--border)',
                boxShadow: isCurrent ? '0 0 12px var(--volt)' : 'none',
              }}>
              <span className={`text-xs font-black ${isActive ? 'text-ink-primary' : 'text-ink-muted'}`}>
                {n}
              </span>
            </button>
          )
        })}
      </div>

      {/* Legenda extremos */}
      <div className="flex items-center justify-between text-[10px] text-ink-muted">
        <span>1 · Leve</span>
        <span className={isWarZone ? 'text-volt font-black animate-pulse' : ''}>
          10 · WAR ZONE 🔥
        </span>
      </div>
    </div>
  )
}
