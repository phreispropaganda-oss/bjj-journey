import { createClient } from '@/lib/supabase/server'
import { BELTS } from '@/lib/curriculum'

interface Kpis {
  total_sessions: number; total_minutes: number; total_hours: number
  current_streak: number; longest_streak: number
  sessions_week: number; sessions_month: number
  last_belt_change: string | null
}

export default async function ProfileHighlights({
  userId, beltId, degrees,
}: { userId: string; beltId: string; degrees: number }) {
  const supabase = await createClient()
  const { data } = await (supabase as unknown as {
    rpc: (n: string, p: Record<string, string>) => Promise<{ data: Kpis[] | null }>
  }).rpc('profile_kpis', { p_uid: userId })
  const k = (data ?? [])[0]
  if (!k) return null

  const belt = BELTS.find(b => b.id === beltId) ?? BELTS[0]
  const lastBeltDate = k.last_belt_change
    ? new Date(k.last_belt_change).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  const cards = [
    {
      label: 'Faixa', value: belt.name,
      sub: degrees > 0 ? `${degrees}° grau` : 'sem graus',
      accent: belt.color, bigText: false,
    },
    { label: 'Último grau', value: lastBeltDate, sub: '', accent: null, bigText: false },
    { label: 'Tempo total', value: `${k.total_hours}h`, sub: `${k.total_minutes % 60}min`, accent: 'volt', bigText: true },
    { label: 'Streak', value: `${k.current_streak}d`, sub: `record ${k.longest_streak}d`, accent: k.current_streak > 0 ? 'blood' : null, bigText: true },
    { label: 'Semana', value: `${k.sessions_week}`, sub: 'treinos', accent: null, bigText: true },
    { label: 'Mês', value: `${k.sessions_month}`, sub: 'treinos', accent: null, bigText: true },
    { label: 'Total', value: `${k.total_sessions}`, sub: 'sessões', accent: 'volt', bigText: true },
    { label: 'Média', value: k.total_sessions > 0 ? `${Math.round(k.total_minutes / k.total_sessions)}` : '0', sub: 'min/treino', accent: null, bigText: true },
  ]

  return (
    <div className="px-4 pt-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-2">Destaques</p>
      <div className="grid grid-cols-4 gap-1.5">
        {cards.map(c => (
          <div key={c.label} className="bg-brand-surface rounded-xl border border-brand-elev p-2 text-center min-h-[68px] flex flex-col justify-center">
            <p className={`font-display leading-none ${c.bigText ? 'text-xl' : 'text-sm'} ${
              c.accent === 'blood' ? 'text-blood' :
              c.accent === 'volt'  ? 'text-volt'  :
                                     'text-ink-primary'
            }`}
            style={c.accent && c.accent.startsWith('#') ? { color: c.accent } : undefined}>
              {c.value}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-ink-muted mt-1 font-bold truncate">{c.label}</p>
            {c.sub && <p className="text-[8px] text-ink-muted truncate">{c.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
