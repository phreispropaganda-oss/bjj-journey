'use client'

import { useEffect, useState } from 'react'

// PRD §4.1 — Super Oss! animação de fagulhas
// CSS-only, sem deps. Aparece centralizada no ponto de toque.

interface Spark { id: number; angle: number; distance: number; emoji: string }

interface Props {
  trigger: number  // valor incremental: muda → dispara
  x?: number       // posição relativa (px) opcional
  y?: number
}

const EMOJIS = ['🔥', '⚡', '💥', '✨', '🥋']

export default function SparksOverlay({ trigger, x, y }: Props) {
  const [sparks, setSparks] = useState<Spark[]>([])

  useEffect(() => {
    if (trigger <= 0) return
    const newSparks: Spark[] = Array.from({ length: 12 }, (_, i) => ({
      id: trigger * 100 + i,
      angle: (Math.PI * 2 * i) / 12 + Math.random() * 0.3,
      distance: 80 + Math.random() * 80,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    }))
    setSparks(newSparks)
    const t = setTimeout(() => setSparks([]), 1200)
    return () => clearTimeout(t)
  }, [trigger])

  if (sparks.length === 0) return null

  const cx = x ?? 0
  const cy = y ?? 0

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <style>{`
        @keyframes sparkFly {
          0%   { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
          20%  { transform: translate(-50%, -50%) scale(1.4); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.6); opacity: 0; }
        }
        @keyframes sparkCore {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          30%  { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
        }
        .super-oss-core {
          position: absolute; width: 60px; height: 60px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(222,255,154,0.9), rgba(158,11,19,0.4), transparent);
          animation: sparkCore 700ms ease-out forwards;
        }
        .super-oss-spark {
          position: absolute; font-size: 24px;
          animation: sparkFly 1100ms ease-out forwards;
          will-change: transform, opacity;
        }
      `}</style>

      {/* Núcleo brilhante */}
      <div className="super-oss-core" style={{ left: cx, top: cy }} />

      {sparks.map(s => {
        const dx = Math.cos(s.angle) * s.distance
        const dy = Math.sin(s.angle) * s.distance
        return (
          <div key={s.id} className="super-oss-spark"
            style={{
              left: cx,
              top: cy,
              ['--dx' as string]: `${dx}px`,
              ['--dy' as string]: `${dy}px`,
            }}>
            {s.emoji}
          </div>
        )
      })}
    </div>
  )
}
