'use client'

// PRD §3.1 — Nível logarítmico
// Fórmula: level = floor(sqrt(minutes/60) / 2) + 1

interface Props {
  totalMinutes: number
  totalHours: number
  currentLevel: number
  levelStartMin: number
  nextLevelMin: number
  minutesInLevel: number
  minutesToNext: number
  levelProgressPct: number
}

export default function LevelProgress(p: Props) {
  const hoursInLevel = Math.floor(p.minutesInLevel / 60)
  const hoursToNext  = Math.ceil(p.minutesToNext / 60)

  return (
    <div className="card-elev relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-blood/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-ink-muted mb-1">
              Nível Marcial
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl text-ink-primary leading-none">
                {p.currentLevel}
              </span>
              <span className="text-ink-secondary text-sm font-bold">
                · {p.totalHours}h totais
              </span>
            </div>
          </div>
          <div className="bg-blood/20 text-blood font-display text-xs px-3 py-1.5 rounded-full border border-blood/30">
            ⚡ XP
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
          <div className="h-full bg-blood rounded-full transition-all duration-700 relative"
            style={{ width: `${p.levelProgressPct}%`, boxShadow: '0 0 12px var(--blood-glow)' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-volt/40 to-transparent" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-ink-muted font-bold">
            {hoursInLevel}h neste nível
          </span>
          <span className="text-[11px] text-volt font-black">
            {hoursToNext > 0 ? `+${hoursToNext}h para Nível ${p.currentLevel + 1}` : 'NÍVEL MÁXIMO'}
          </span>
        </div>
      </div>
    </div>
  )
}
