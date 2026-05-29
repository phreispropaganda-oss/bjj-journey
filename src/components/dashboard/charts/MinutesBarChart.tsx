'use client'

// 30-day stacked bars by training type — Strava-style activity chart
// Each bar = 1 day, color stacked by type

interface Session {
  trained_at: string
  duration_min: number
  type: string
}

const TYPE_COLOR: Record<string, string> = {
  gi:          '#CC0000',
  no_gi:       '#F59E0B',
  drilling:    '#2563EB',
  competition: '#7C3AED',
  open_mat:    '#16A34A',
}

export default function MinutesBarChart({ sessions }: { sessions: Session[] }) {
  const today = new Date()
  const days: { date: string; segments: { color: string; min: number }[]; total: number }[] = []

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const daySessions = sessions.filter(s => s.trained_at.startsWith(dateStr))
    const segments = daySessions.map(s => ({
      color: TYPE_COLOR[s.type] ?? '#888',
      min: s.duration_min ?? 0,
    }))
    const total = segments.reduce((sum, s) => sum + s.min, 0)
    days.push({ date: dateStr, segments, total })
  }

  const maxTotal = Math.max(...days.map(d => d.total), 60)
  const weeklyTotal = days.slice(-7).reduce((a, d) => a + d.total, 0)
  const monthlyTotal = days.reduce((a, d) => a + d.total, 0)
  const avgPerDay = Math.round(monthlyTotal / 30)

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-[#555]">
          Carga semanal · últimos 30 dias
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div>
          <p className="text-[10px] text-[#888] uppercase tracking-wider font-bold">7 dias</p>
          <p className="text-[#0D0D0D] font-black text-lg leading-none">
            {Math.floor(weeklyTotal / 60)}<span className="text-xs text-[#888]">h</span>
            {weeklyTotal % 60 > 0 && <span> {weeklyTotal % 60}<span className="text-xs text-[#888]">min</span></span>}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#888] uppercase tracking-wider font-bold">30 dias</p>
          <p className="text-[#0D0D0D] font-black text-lg leading-none">
            {Math.floor(monthlyTotal / 60)}<span className="text-xs text-[#888]">h</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#888] uppercase tracking-wider font-bold">Média/dia</p>
          <p className="text-[#CC0000] font-black text-lg leading-none">
            {avgPerDay}<span className="text-xs text-[#888]">min</span>
          </p>
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-0.5 h-24">
        {days.map((d) => {
          const height = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0
          return (
            <div key={d.date} className="flex-1 flex flex-col justify-end h-full group relative">
              {d.total > 0 ? (
                <div className="w-full flex flex-col-reverse rounded-t-sm overflow-hidden" style={{ height: `${height}%` }}>
                  {d.segments.map((s, i) => (
                    <div key={i} className="w-full" style={{
                      background: s.color,
                      height: `${(s.min / d.total) * 100}%`,
                    }} />
                  ))}
                </div>
              ) : (
                <div className="w-full h-0.5 bg-[#F2F0ED]" />
              )}
              {/* Tooltip */}
              {d.total > 0 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0D0D0D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {d.total}min
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#F2F0ED]">
        {Object.entries(TYPE_COLOR).filter(([k]) => sessions.some(s => s.type === k)).map(([type, color]) => {
          const labels: Record<string, string> = { gi: 'Gi', no_gi: 'No-Gi', drilling: 'Drilling', competition: 'Comp.', open_mat: 'Open Mat' }
          return (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
              <span className="text-[10px] text-[#555] font-bold">{labels[type]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
