'use client'

import { useState } from 'react'

// PRD §3.3 — Heatmap GitHub-style com toggle de ano

interface Props {
  attendance: { date: string }[]
  trainingSessions?: { trained_at: string; duration_min: number }[]
}

export default function HeatmapYoY({ attendance, trainingSessions = [] }: Props) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  // Minutos por dia
  const minutesByDay: Record<string, number> = {}
  for (const s of trainingSessions) {
    const date = s.trained_at.split('T')[0]
    minutesByDay[date] = (minutesByDay[date] ?? 0) + (s.duration_min ?? 0)
  }
  const attendSet = new Set(attendance.map(a => a.date))

  // Geração de 52 semanas a partir do início do ano
  const startDate = new Date(year, 0, 1)
  startDate.setDate(startDate.getDate() - startDate.getDay()) // domingo

  const weeks: { date: string; intensity: number; inYear: boolean }[][] = []
  let active = 0
  for (let w = 0; w < 53; w++) {
    const week: { date: string; intensity: number; inYear: boolean }[] = []
    for (let d = 0; d < 7; d++) {
      const cur = new Date(startDate)
      cur.setDate(startDate.getDate() + w * 7 + d)
      const ds = cur.toISOString().split('T')[0]
      const inYear = cur.getFullYear() === year
      const mins = inYear ? (minutesByDay[ds] ?? 0) : 0
      let intensity = 0
      if (mins > 0) intensity = mins >= 90 ? 4 : mins >= 60 ? 3 : mins >= 30 ? 2 : 1
      else if (inYear && attendSet.has(ds)) intensity = 1
      if (intensity > 0 && inYear) active++
      week.push({ date: ds, intensity, inYear })
    }
    weeks.push(week)
  }

  const COLORS = ['#161616', 'rgba(158,11,19,0.3)', 'rgba(158,11,19,0.55)', '#9E0B13', '#DEFF9A']

  return (
    <div className="card-elev">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary">
          Frequência
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear(y => y - 1)}
            className="w-7 h-7 rounded-md bg-brand-elev text-ink-secondary text-xs font-black hover:bg-brand-hover">
            ‹
          </button>
          <span className="font-display text-sm text-ink-primary px-2">{year}</span>
          <button
            onClick={() => setYear(y => Math.min(currentYear, y + 1))}
            disabled={year >= currentYear}
            className="w-7 h-7 rounded-md bg-brand-elev text-ink-secondary text-xs font-black hover:bg-brand-hover disabled:opacity-30">
            ›
          </button>
        </div>
      </div>

      <p className="text-[10px] text-ink-muted mb-2">
        {active} dias ativos em {year}
      </p>

      <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
        <div className="flex gap-[2px] min-w-fit">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((d, di) => (
                <div key={`${wi}-${di}`}
                  className="w-3 h-3 rounded-[2px]"
                  style={{
                    background: d.inYear ? COLORS[d.intensity] : 'transparent',
                    opacity: d.inYear ? 1 : 0.2,
                  }}
                  title={d.inYear ? `${d.date}` : ''} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-elev">
        <span className="text-[10px] text-ink-muted">Menos</span>
        <div className="flex gap-1">
          {COLORS.map((c, i) => (
            <div key={i} className="w-3 h-3 rounded-[2px]" style={{ background: c }} />
          ))}
        </div>
        <span className="text-[10px] text-ink-muted">Volt</span>
      </div>
    </div>
  )
}
