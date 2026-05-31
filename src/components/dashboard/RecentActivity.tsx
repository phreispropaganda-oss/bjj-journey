'use client'

import Link from 'next/link'

interface Session {
  id: string
  type: string
  duration_min: number
  trained_at: string
}

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  gi:          { emoji: '🥋', label: 'Gi' },
  no_gi:       { emoji: '👕', label: 'No-Gi' },
  drilling:    { emoji: '🔁', label: 'Drilling' },
  competition: { emoji: '🏆', label: 'Competição' },
  open_mat:    { emoji: '🤝', label: 'Open Mat' },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

interface Props {
  sessions: Session[]
  limit?: number
}

export default function RecentActivity({ sessions, limit = 5 }: Props) {
  const recent = sessions.slice(0, limit)

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="font-display text-base text-ink-primary">Recent Activity</p>
        <Link href="/calendar" className="text-rise text-xs font-black">See All →</Link>
      </div>

      {recent.length === 0 ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-elev p-6 text-center">
          <p className="text-3xl mb-2">🥋</p>
          <p className="text-ink-secondary text-sm">Sem treinos ainda. Registre o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map(s => {
            const meta = TYPE_META[s.type] ?? { emoji: '🥋', label: s.type }
            return (
              <Link key={s.id} href={`/treino/${s.id}/share`}
                className="block bg-brand-surface rounded-2xl border border-brand-elev px-3 py-3 active:bg-brand-elev transition-colors">
                <div className="flex items-center gap-3">
                  {/* Avatar circular laranja Strava-style */}
                  <div className="w-12 h-12 rounded-full bg-rise/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{meta.emoji}</span>
                  </div>
                  {/* Titulo + data */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-ink-primary font-bold text-sm capitalize truncate">{meta.label}</p>
                      <span className="text-ink-muted text-[10px] flex-shrink-0">·</span>
                      <span className="text-ink-muted text-[10px] flex-shrink-0">{formatDate(s.trained_at)}</span>
                    </div>
                    <p className="font-display text-2xl text-ink-primary leading-tight tabular-nums mt-0.5">
                      {s.duration_min} <span className="text-sm text-ink-muted font-bold">min</span>
                    </p>
                  </div>
                  {/* Chevron */}
                  <span className="text-ink-muted text-lg flex-shrink-0">›</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
