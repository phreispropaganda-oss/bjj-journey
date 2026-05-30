'use client'

// PRD §3.3 — Personal Records
interface Props {
  longestStreakDays: number
  longestSessionMin: number
  longestSessionDate: string | null
  mostSubsWeek: number
  mostSubsWeekStart: string | null
  firstTrainingDate: string | null
  mostActiveMonth: string | null
  mostActiveMonthCount: number
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  })
}

function formatMonth(yyyymm: string | null) {
  if (!yyyymm) return '—'
  const [year, month] = yyyymm.split('-')
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${months[parseInt(month) - 1]} ${year}`
}

export default function PersonalRecords(p: Props) {
  const records = [
    {
      emoji: '🔥',
      label: 'Maior sequência',
      value: `${p.longestStreakDays}d`,
      hint: 'dias seguidos',
      color: 'blood',
    },
    {
      emoji: '⏱',
      label: 'Treino mais longo',
      value: `${p.longestSessionMin}min`,
      hint: formatDate(p.longestSessionDate),
      color: 'volt',
    },
    {
      emoji: '🏆',
      label: 'Top finalizações/semana',
      value: `${p.mostSubsWeek}`,
      hint: p.mostSubsWeekStart ? `semana de ${formatDate(p.mostSubsWeekStart)}` : '—',
      color: 'volt',
    },
    {
      emoji: '🥇',
      label: 'Mês mais ativo',
      value: `${p.mostActiveMonthCount}`,
      hint: `treinos · ${formatMonth(p.mostActiveMonth)}`,
      color: 'blood',
    },
  ]

  const hasData = p.longestStreakDays > 0 || p.longestSessionMin > 0

  if (!hasData) return null

  return (
    <div className="card-elev">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary">
          🏅 Personal Records
        </p>
        {p.firstTrainingDate && (
          <span className="text-[10px] text-ink-muted">
            desde {formatDate(p.firstTrainingDate)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {records.map((r, i) => (
          <div key={i}
            className="bg-brand-bg rounded-xl p-3 border border-brand-elev">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{r.emoji}</span>
              <span className="text-[9px] uppercase tracking-wider text-ink-muted font-bold">
                {r.label}
              </span>
            </div>
            <p className={`font-display text-xl ${r.color === 'volt' ? 'text-volt' : 'text-blood'}`}>
              {r.value}
            </p>
            <p className="text-[10px] text-ink-muted mt-0.5 leading-tight">{r.hint}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
