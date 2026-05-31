'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/ui/BottomNav'

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

interface Session {
  id: string; type: string; duration_min: number;
  trained_at: string; calories: number | null; note: string | null;
}

const TYPE_EMOJI: Record<string, string> = {
  gi: '🥋', no_gi: '👕', drilling: '🔁', competition: '🏆', open_mat: '🤝',
}

export default function CalendarPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [today] = useState(new Date())
  const [cur, setCur] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() })
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [marking, setMarking] = useState(false)

  async function markToday() {
    if (marking) return
    setMarking(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMarking(false); return }
    const payload = {
      user_id: user.id,
      type: 'gi',
      duration_min: 60,
      trained_at: new Date().toISOString(),
      techniques: [] as string[],
      visibility: 'private',
      note: 'Presença rápida',
    }
    const { data } = await (supabase.from('training_sessions') as ReturnType<typeof supabase.from>)
      .insert(payload as never).select('id, type, duration_min, trained_at, calories, note').single()
    if (data) setSessions(prev => [data as Session, ...prev])
    setMarking(false)
  }

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const todayStr = fmt(today)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('training_sessions')
        .select('id, type, duration_min, trained_at, calories, note')
        .eq('user_id', user.id)
        .order('trained_at', { ascending: false })
      setSessions((data ?? []) as Session[])
      setLoading(false)
    }
    load()
  }, [])

  // Index sessions by yyyy-mm-dd
  const byDay = new Map<string, Session[]>()
  sessions.forEach(s => {
    const d = s.trained_at.slice(0, 10)
    const arr = byDay.get(d) ?? []
    arr.push(s); byDay.set(d, arr)
  })

  function intensity(date: string): 0 | 1 | 2 | 3 {
    const c = byDay.get(date)?.length ?? 0
    if (c === 0) return 0
    if (c === 1) return 1
    if (c === 2) return 2
    return 3
  }

  // Stats
  const totalTrains = sessions.length
  const monthTrains = sessions.filter(s => {
    const d = new Date(s.trained_at)
    return d.getFullYear() === cur.y && d.getMonth() === cur.m
  }).length
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay()); weekStart.setHours(0,0,0,0)
  const weekTrains = sessions.filter(s => new Date(s.trained_at) >= weekStart).length

  // Streak
  const streak = (() => {
    let s = 0
    const d = new Date(todayStr)
    while (byDay.has(fmt(d))) { s++; d.setDate(d.getDate() - 1) }
    return s
  })()

  const firstDay = new Date(cur.y, cur.m, 1).getDay()
  const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate()
  const openSessions = openDay ? (byDay.get(openDay) ?? []) : []

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center justify-between">
        <h1 className="font-display text-base text-ink-primary">Calendário</h1>
        <Link href="/treino/novo?retro=1"
          className="bg-rise text-ink-primary text-xs font-black px-3 py-1.5 rounded-full">
          + Treino retroativo
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pt-4 pb-24 space-y-3">
        {/* Streak hero */}
        <div className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #9E0B13, #6C0710)' }}>
          <div className="text-4xl">🔥</div>
          <div className="text-white">
            <p className="text-4xl font-display leading-none">{streak}</p>
            <p className="text-sm font-bold opacity-90">dias consecutivos</p>
            <p className="text-xs opacity-60 mt-0.5">{totalTrains} treinos no histórico</p>
          </div>
        </div>

        {/* Marcar presença hoje — atalho rápido */}
        {!byDay.has(todayStr) && (
          <button onClick={markToday} disabled={marking}
            className="w-full bg-rise text-white font-display text-base py-4 rounded-2xl shadow-glow-rise disabled:opacity-50">
            {marking ? 'Marcando...' : '✓ Marcar presença de hoje'}
          </button>
        )}
        {byDay.has(todayStr) && (
          <div className="flex items-center justify-center gap-2 py-3 text-volt font-black text-sm bg-volt/10 rounded-2xl border border-volt/30">
            <span className="text-xl">✓</span> Presença de hoje registrada
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { n: monthTrains, l: 'Este mês' },
            { n: totalTrains, l: 'Total' },
            { n: weekTrains, l: 'Esta semana' },
          ].map(s => (
            <div key={s.l} className="bg-brand-surface rounded-2xl p-3 text-center border border-brand-elev">
              <p className="font-display text-2xl text-volt">{s.n}</p>
              <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wide mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="bg-brand-surface rounded-2xl p-4 border border-brand-elev">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCur(c => c.m === 0 ? { y: c.y-1, m: 11 } : { ...c, m: c.m-1 })}
              className="w-8 h-8 rounded-full bg-brand-elev flex items-center justify-center text-ink-primary font-bold">‹</button>
            <p className="font-display text-base text-ink-primary">{MONTHS[cur.m]} {cur.y}</p>
            <button onClick={() => setCur(c => c.m === 11 ? { y: c.y+1, m: 0 } : { ...c, m: c.m+1 })}
              className="w-8 h-8 rounded-full bg-brand-elev flex items-center justify-center text-ink-primary font-bold">›</button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-black text-ink-muted uppercase py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateStr = `${cur.y}-${String(cur.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const lvl = intensity(dateStr)
              const isToday = dateStr === todayStr
              const isFuture = dateStr > todayStr
              return (
                <button key={day}
                  onClick={() => {
                    if (isFuture) return
                    if (lvl > 0) setOpenDay(dateStr)
                    else window.location.href = `/treino/novo?date=${dateStr}`
                  }}
                  disabled={isFuture}
                  className={`relative aspect-square rounded-lg flex items-center justify-center text-sm font-black transition-all
                    ${lvl === 0 && !isToday && !isFuture ? 'text-ink-secondary bg-brand-elev/40 hover:bg-brand-elev' : ''}
                    ${lvl === 1 ? 'text-brand-bg bg-rise/70' : ''}
                    ${lvl === 2 ? 'text-white bg-rise' : ''}
                    ${lvl === 3 ? 'text-white bg-rise-deep ring-2 ring-volt' : ''}
                    ${isFuture ? 'text-ink-muted/50 cursor-default' : ''}
                    ${isToday && lvl === 0 ? 'ring-2 ring-rise text-rise font-black' : ''}
                    ${isToday && lvl > 0 ? 'ring-2 ring-volt' : ''}
                  `}>
                  <span className="relative z-10">{day}</span>
                  {lvl === 3 && <span className="absolute top-0.5 right-0.5 text-[8px] text-volt">★</span>}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-brand-elev">
            <span className="text-[9px] text-ink-muted uppercase font-bold">Intensidade</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-brand-bg/40 border border-brand-elev" />
              <span className="text-[9px] text-ink-muted">0</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-volt/30" />
              <span className="text-[9px] text-ink-muted">1</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blood/50" />
              <span className="text-[9px] text-ink-muted">2</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blood" />
              <span className="text-[9px] text-volt">3+ ★</span>
            </div>
          </div>
        </div>

        {loading && <p className="text-center text-ink-muted text-xs py-4">Carregando...</p>}
        {!loading && sessions.length === 0 && (
          <div className="card-elev text-center py-8">
            <p className="text-4xl mb-2">🥋</p>
            <p className="font-display text-ink-primary mb-1">Sem treinos ainda</p>
            <p className="text-sm text-ink-secondary mb-4">Registre o primeiro para começar a popular o calendário.</p>
            <Link href="/treino/novo" className="btn-primary inline-block">Registrar treino</Link>
          </div>
        )}
      </div>

      {/* Bottom-sheet do dia */}
      {openDay && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setOpenDay(null)}>
          <div className="bg-brand-surface w-full max-w-[480px] mx-auto rounded-t-3xl p-5 border-t border-brand-elev max-h-[70vh] overflow-y-auto"
            style={{ animation: 'fadeUp 0.25s ease' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-display text-base text-ink-primary">
                {new Date(openDay).toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'long' })}
              </p>
              <button onClick={() => setOpenDay(null)} className="text-ink-muted text-xl min-h-tap min-w-tap">✕</button>
            </div>
            <div className="space-y-2">
              {openSessions.map(s => (
                <Link key={s.id} href={`/treino/${s.id}/share`}
                  className="block bg-brand-bg rounded-xl p-3 border border-brand-elev hover:border-blood/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{TYPE_EMOJI[s.type] ?? '🥋'}</span>
                    <span className="text-ink-primary font-bold text-sm capitalize">{s.type.replace('_', ' ')}</span>
                    <span className="ml-auto text-ink-secondary text-xs">
                      {new Date(s.trained_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-ink-secondary">
                    <span>⏱ {s.duration_min}min</span>
                    {s.calories != null && <span>🔥 {s.calories}kcal</span>}
                  </div>
                  {s.note && <p className="text-ink-muted text-xs mt-1 italic line-clamp-2">&ldquo;{s.note}&rdquo;</p>}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav active="calendar" />
    </div>
  )
}
