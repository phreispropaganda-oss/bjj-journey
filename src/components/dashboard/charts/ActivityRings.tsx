'use client'

// Apple Fitness-style activity rings — 3 concentric goals
// Outer: weekly minutes (target 300min)
// Middle: weekly trainings (target 4)
// Inner: streak (target 7)

interface Props {
  weekMinutes: number
  weekTrainings: number
  currentStreak: number
}

const RINGS = [
  { id: 'minutes',   color: '#CC0000', track: '#FFCCCC', target: 300, label: 'Min',     unit: 'min' },
  { id: 'trainings', color: '#16A34A', track: '#BBF7D0', target: 4,   label: 'Treinos', unit: '' },
  { id: 'streak',    color: '#F59E0B', track: '#FED7AA', target: 7,   label: 'Streak',  unit: 'd' },
]

function Ring({ pct, color, track, radius, strokeWidth, cx, cy }: {
  pct: number; color: string; track: string;
  radius: number; strokeWidth: number; cx: number; cy: number
}) {
  const circ = 2 * Math.PI * radius
  const dashArray = `${(Math.min(pct, 100) / 100) * circ} ${circ}`
  return (
    <>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={track} strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeDasharray={dashArray} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      {/* Tail effect on overflow */}
      {pct >= 100 && (
        <circle cx={cx} cy={cy - radius} r={strokeWidth / 2} fill={color} />
      )}
    </>
  )
}

export default function ActivityRings({ weekMinutes, weekTrainings, currentStreak }: Props) {
  const values = [weekMinutes, weekTrainings, currentStreak]
  const pcts = RINGS.map((r, i) => Math.min(200, (values[i] / r.target) * 100))

  const size = 140
  const cx = size / 2
  const cy = size / 2
  const sw = 10
  const padding = 2

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-3">Metas da semana</p>
      <div className="flex items-center gap-4">
        <svg width={size} height={size} className="flex-shrink-0">
          {RINGS.map((r, i) => (
            <Ring key={r.id}
              pct={pcts[i]}
              color={r.color}
              track={r.track}
              radius={(size / 2) - sw / 2 - padding - i * (sw + padding)}
              strokeWidth={sw}
              cx={cx} cy={cy} />
          ))}
        </svg>
        <div className="flex-1 space-y-2">
          {RINGS.map((r, i) => {
            const pct = Math.min(100, pcts[i])
            const achieved = pcts[i] >= 100
            return (
              <div key={r.id} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[#0D0D0D] text-xs font-black">{r.label}</span>
                    <span className="text-[11px] font-black" style={{ color: r.color }}>
                      {values[i]}{r.unit}<span className="text-[#AAA]">/{r.target}{r.unit}</span>
                    </span>
                  </div>
                  <div className="h-1 bg-[#F2F0ED] rounded-full mt-0.5">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: r.color }} />
                  </div>
                </div>
                {achieved && <span className="text-xs">✓</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
