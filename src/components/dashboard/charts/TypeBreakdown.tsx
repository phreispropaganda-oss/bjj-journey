'use client'

// Type breakdown as horizontal bars (Garmin-style)
// More readable on mobile than pie chart

interface Session { type: string; duration_min: number }

const TYPE_META: Record<string, { label: string; color: string; emoji: string }> = {
  gi:          { label: 'Gi',         color: '#CC0000', emoji: '🥋' },
  no_gi:       { label: 'No-Gi',      color: '#F59E0B', emoji: '👕' },
  drilling:    { label: 'Drilling',   color: '#2563EB', emoji: '🔁' },
  competition: { label: 'Competição', color: '#7C3AED', emoji: '🏆' },
  open_mat:    { label: 'Open Mat',   color: '#16A34A', emoji: '🤝' },
}

export default function TypeBreakdown({ sessions }: { sessions: Session[] }) {
  const byType: Record<string, { minutes: number; count: number }> = {}
  for (const s of sessions) {
    if (!byType[s.type]) byType[s.type] = { minutes: 0, count: 0 }
    byType[s.type].minutes += s.duration_min ?? 0
    byType[s.type].count += 1
  }

  const totalMin = Object.values(byType).reduce((a, b) => a + b.minutes, 0)
  if (totalMin === 0) return null

  const sorted = Object.entries(byType).sort((a, b) => b[1].minutes - a[1].minutes)

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-3">
        Composição dos treinos
      </p>
      <div className="space-y-2.5">
        {sorted.map(([type, data]) => {
          const meta = TYPE_META[type] ?? { label: type, color: '#888', emoji: '🥋' }
          const pct = (data.minutes / totalMin) * 100
          return (
            <div key={type}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{meta.emoji}</span>
                  <span className="text-xs font-black text-[#0D0D0D]">{meta.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#888]">{data.count} treinos</span>
                  <span className="text-xs font-black" style={{ color: meta.color }}>
                    {Math.round(pct)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-[#F2F0ED] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${pct}%`, background: meta.color,
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
