import { createClient } from '@/lib/supabase/server'

interface Session { duration_min: number; trained_at: string; calories: number | null; subs_for: number }

/** Buckets de 12 semanas para gráfico de barras + 30d de calorias em area */
export default async function StatsCharts({ userId }: { userId: string }) {
  const supabase = await createClient()
  const since = new Date(Date.now() - 84 * 86400000).toISOString() // 12 semanas
  const { data } = await supabase
    .from('training_sessions')
    .select('duration_min, trained_at, calories, subs_for')
    .eq('user_id', userId)
    .gte('trained_at', since)
    .order('trained_at', { ascending: true })
  const sessions = (data ?? []) as Session[]
  if (sessions.length === 0) return null

  // ── Buckets semanais (12) ──
  const weeks: { minutes: number; calories: number; count: number; label: string }[] = []
  const today = new Date()
  for (let i = 11; i >= 0; i--) {
    const start = new Date(today); start.setDate(today.getDate() - i * 7 - today.getDay())
    weeks.push({ minutes: 0, calories: 0, count: 0, label: `${start.getDate()}/${start.getMonth()+1}` })
  }
  for (const s of sessions) {
    const d = new Date(s.trained_at)
    const weeksAgo = Math.floor((today.getTime() - d.getTime()) / (7 * 86400000))
    const idx = 11 - weeksAgo
    if (idx < 0 || idx > 11) continue
    weeks[idx].minutes += s.duration_min
    weeks[idx].calories += s.calories ?? 0
    weeks[idx].count++
  }
  const maxMin = Math.max(1, ...weeks.map(w => w.minutes))

  // ── Linha de evolução calorias (28d) ──
  const days = 28
  const daily: { cal: number; date: string }[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (days - 1 - i))
    return { cal: 0, date: d.toISOString().slice(0,10) }
  })
  const dateIdx = new Map(daily.map((d, i) => [d.date, i]))
  for (const s of sessions) {
    const k = s.trained_at.slice(0,10)
    const i = dateIdx.get(k)
    if (i !== undefined) daily[i].cal += s.calories ?? 0
  }
  const maxCal = Math.max(1, ...daily.map(d => d.cal))

  // SVG path para area chart
  const W = 320, H = 80, PAD = 4
  const pathPoints = daily.map((d, i) => {
    const x = PAD + (i / (days - 1)) * (W - 2 * PAD)
    const y = H - PAD - (d.cal / maxCal) * (H - 2 * PAD)
    return [x, y] as const
  })
  const linePath = pathPoints.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ')
  const areaPath = `${linePath} L ${W - PAD} ${H - PAD} L ${PAD} ${H - PAD} Z`

  // KPIs do periodo
  const totalMin = sessions.reduce((a, s) => a + s.duration_min, 0)
  const totalCal = sessions.reduce((a, s) => a + (s.calories ?? 0), 0)
  const totalSubs = sessions.reduce((a, s) => a + s.subs_for, 0)
  const avgPerWeek = (sessions.length / 12).toFixed(1)

  return (
    <div className="space-y-3 px-4 mt-3">
      {/* Area chart calorias 28d */}
      <div className="bg-brand-surface rounded-2xl border border-brand-elev p-4 overflow-hidden">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary">Calorias 28 dias</p>
            <p className="font-display text-volt text-3xl leading-none">{totalCal.toLocaleString('pt-BR')}<span className="text-sm text-ink-muted ml-1">kcal</span></p>
          </div>
          <p className="text-[10px] text-ink-muted font-bold">pico {maxCal} kcal/dia</p>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
          <defs>
            <linearGradient id="risegrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#CC0000" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#CC0000" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#risegrad)" />
          <path d={linePath} fill="none" stroke="#CC0000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex justify-between text-[9px] text-ink-muted mt-1">
          <span>{daily[0].date.slice(5).replace('-','/')}</span>
          <span>{daily[Math.floor(days/2)].date.slice(5).replace('-','/')}</span>
          <span>hoje</span>
        </div>
      </div>

      {/* Bar chart 12 semanas */}
      <div className="bg-brand-surface rounded-2xl border border-brand-elev p-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary">Minutos por semana</p>
            <p className="font-display text-ink-primary text-3xl leading-none">{Math.round(totalMin/60)}<span className="text-sm text-ink-muted ml-1">h em 12 sem</span></p>
          </div>
          <p className="text-[10px] text-ink-muted font-bold">média {avgPerWeek}×/sem</p>
        </div>
        <div className="flex items-end gap-1 h-24">
          {weeks.map((w, i) => {
            const h = (w.minutes / maxMin) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-brand-bg rounded-t-md relative flex-1 flex items-end">
                  <div className="w-full rounded-t-md transition-all"
                    style={{ height: `${h}%`, background: 'linear-gradient(180deg, #CC0000 0%, #9E0B13 100%)', minHeight: w.minutes > 0 ? 2 : 0 }} />
                </div>
                <span className="text-[8px] text-ink-muted leading-none">{w.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* KPIs strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-brand-surface rounded-xl border border-brand-elev p-3 text-center">
          <p className="font-display text-rise text-2xl">{sessions.length}</p>
          <p className="text-[9px] uppercase tracking-wider text-ink-muted font-bold mt-0.5">Sessões</p>
        </div>
        <div className="bg-brand-surface rounded-xl border border-brand-elev p-3 text-center">
          <p className="font-display text-volt text-2xl">{Math.round(totalMin/60)}h</p>
          <p className="text-[9px] uppercase tracking-wider text-ink-muted font-bold mt-0.5">No tatame</p>
        </div>
        <div className="bg-brand-surface rounded-xl border border-brand-elev p-3 text-center">
          <p className="font-display text-ink-primary text-2xl">{totalSubs}</p>
          <p className="text-[9px] uppercase tracking-wider text-ink-muted font-bold mt-0.5">Finalizações</p>
        </div>
      </div>
    </div>
  )
}
