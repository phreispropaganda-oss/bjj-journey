'use client'

// 90-day attendance heatmap — Strava/GitHub style with intensity levels

interface Props {
  attendance: { date: string }[]
  trainingSessions?: { trained_at: string; duration_min: number }[]
}

export default function StreakHeatmap({ attendance, trainingSessions = [] }: Props) {
  const today = new Date()
  const days: { date: string; intensity: number; label: string }[] = []
  const attendSet = new Set(attendance.map(a => a.date))

  // Compute minutes per day
  const minutesByDay: Record<string, number> = {}
  for (const s of trainingSessions) {
    const date = s.trained_at.split('T')[0]
    minutesByDay[date] = (minutesByDay[date] ?? 0) + (s.duration_min ?? 0)
  }

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const mins = minutesByDay[ds] ?? 0
    let intensity = 0
    if (mins > 0) intensity = mins >= 90 ? 4 : mins >= 60 ? 3 : mins >= 30 ? 2 : 1
    else if (attendSet.has(ds)) intensity = 1
    days.push({
      date: ds,
      intensity,
      label: mins > 0 ? `${mins}min` : attendSet.has(ds) ? 'presente' : '',
    })
  }

  // Calculate longest streak in the 90 days
  let longestStreak = 0
  let currentStreak = 0
  for (const d of days) {
    if (d.intensity > 0) {
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else currentStreak = 0
  }
  const activeDays = days.filter(d => d.intensity > 0).length

  // Group into weeks (column-major)
  const weeks: typeof days[] = []
  let cur: typeof days = []
  const startDay = new Date(days[0].date).getDay()
  for (let i = 0; i < startDay; i++) cur.push({ date: '', intensity: -1, label: '' })
  for (const d of days) {
    cur.push(d)
    if (cur.length === 7) { weeks.push(cur); cur = [] }
  }
  if (cur.length) weeks.push(cur)

  const COLORS = ['#F2F0ED', '#FFCCCC', '#FF9999', '#E52222', '#A80000']

  return (
    <div className="bg-brand-surface rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary">
          Frequência · últimos 90 dias
        </p>
        <span className="text-[10px] text-ink-muted">
          {activeDays} dias · máx {longestStreak}d seguidos
        </span>
      </div>

      <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
        <div className="flex gap-1 min-w-fit">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((d, di) => (
                <div key={`${wi}-${di}`} className="w-3 h-3 rounded-sm"
                  style={{ background: d.intensity < 0 ? 'transparent' : COLORS[d.intensity] }}
                  title={d.date ? `${d.date}${d.label ? ` · ${d.label}` : ''}` : ''} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-elev">
        <span className="text-[10px] text-ink-muted">Menos</span>
        <div className="flex gap-1">
          {COLORS.map((c, i) => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
          ))}
        </div>
        <span className="text-[10px] text-ink-muted">Mais</span>
      </div>
    </div>
  )
}
