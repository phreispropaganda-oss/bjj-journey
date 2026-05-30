'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BELTS } from '@/lib/curriculum'

interface Session {
  id: string; type: string; duration_min: number; trained_at: string
}

interface Props {
  sessions: Session[]
  beltId: string
  /** Modo perfil publico: limita navegacao a ultimos 2 meses */
  publicMode?: boolean
}

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const TYPE_EMOJI: Record<string, string> = {
  gi: '🥋', no_gi: '👕', drilling: '🔁', competition: '🏆', open_mat: '🤝',
}

export default function MonthlyCalendar({ sessions, beltId, publicMode = false }: Props) {
  const today = useMemo(() => new Date(), [])
  const [cur, setCur] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [dir, setDir] = useState<1 | -1>(1)
  const [openDay, setOpenDay] = useState<string | null>(null)

  const belt = BELTS.find(b => b.id === beltId) ?? BELTS[0]
  const byDay = useMemo(() => {
    const m = new Map<string, Session[]>()
    for (const s of sessions) {
      const d = s.trained_at.slice(0, 10)
      const arr = m.get(d) ?? []
      arr.push(s); m.set(d, arr)
    }
    return m
  }, [sessions])

  // Limites de navegacao
  const minMonth = publicMode
    ? new Date(today.getFullYear(), today.getMonth() - 1, 1)
    : new Date(2020, 0, 1)
  const maxMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const curDate = new Date(cur.y, cur.m, 1)
  const canPrev = curDate > minMonth
  const canNext = curDate < maxMonth

  function nav(delta: 1 | -1) {
    setDir(delta)
    setCur(c => {
      if (delta === -1 && !canPrev) return c
      if (delta ===  1 && !canNext) return c
      return c.m + delta < 0  ? { y: c.y - 1, m: 11 }
           : c.m + delta > 11 ? { y: c.y + 1, m: 0 }
                              : { ...c, m: c.m + delta }
    })
  }

  // Stats do mes
  const monthPrefix = `${cur.y}-${String(cur.m + 1).padStart(2, '0')}`
  const monthSessions = sessions.filter(s => s.trained_at.startsWith(monthPrefix))
  const trainedDaysInMonth = new Set(monthSessions.map(s => s.trained_at.slice(0, 10))).size

  // Streak atual
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const todayStr = fmt(today)
  const streak = useMemo(() => {
    let s = 0; const d = new Date(todayStr)
    while (byDay.has(fmt(d))) { s++; d.setDate(d.getDate() - 1) }
    return s
  }, [byDay, todayStr])

  // Grid
  const firstDow = new Date(cur.y, cur.m, 1).getDay()
  const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate()
  const openSessions = openDay ? (byDay.get(openDay) ?? []) : []

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-elev p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary">
          {trainedDaysInMonth} treinos · 🔥 streak {streak}d
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button onClick={() => nav(-1)} disabled={!canPrev}
          className="w-8 h-8 rounded-full bg-brand-elev flex items-center justify-center text-ink-primary font-bold disabled:opacity-30 min-h-tap min-w-tap">‹</button>
        <p className="font-display text-base text-ink-primary">{MONTHS[cur.m]} {cur.y}</p>
        <button onClick={() => nav(1)} disabled={!canNext}
          className="w-8 h-8 rounded-full bg-brand-elev flex items-center justify-center text-ink-primary font-bold disabled:opacity-30 min-h-tap min-w-tap">›</button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-black text-ink-muted uppercase py-1">{d}</div>
        ))}
      </div>

      {/* Grid animado */}
      <div className="relative" style={{ minHeight: 260 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${cur.y}-${cur.m}`}
            initial={{ x: dir * 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -dir * 100, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="grid grid-cols-7 gap-1">
            {Array(firstDow).fill(null).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`
              const list = byDay.get(dateStr) ?? []
              const count = list.length
              const isToday = dateStr === todayStr
              const isFuture = dateStr > todayStr

              return (
                <button key={day} disabled={isFuture || count === 0}
                  onClick={() => setOpenDay(dateStr)}
                  className={`relative aspect-square rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${isFuture ? 'text-ink-muted/30' : count === 0 ? 'text-ink-muted bg-brand-bg/40' : 'text-white'}
                    ${isToday ? 'ring-1 ring-volt' : ''}
                  `}
                  style={count > 0 ? {
                    background: belt.color,
                    boxShadow: count > 1 ? `inset 0 0 0 2px white, inset 0 0 0 3px ${belt.color}` : undefined,
                  } : undefined}>
                  {day}
                  {count >= 3 && (
                    <span className="absolute -top-0.5 -right-0.5 text-[9px] text-volt">★</span>
                  )}
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom-sheet detalhes */}
      <AnimatePresence>
        {openDay && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setOpenDay(null)}>
            <motion.div
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-brand-surface w-full max-w-[480px] mx-auto rounded-t-3xl p-5 border-t border-brand-elev max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <p className="font-display text-base text-ink-primary">
                  {new Date(openDay).toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'long' })}
                </p>
                <button onClick={() => setOpenDay(null)} className="text-ink-muted text-xl min-h-tap min-w-tap">✕</button>
              </div>
              <div className="space-y-2">
                {openSessions.map(s => (
                  <a key={s.id} href={`/treino/${s.id}/share`}
                    className="block bg-brand-bg rounded-xl p-3 border border-brand-elev">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{TYPE_EMOJI[s.type] ?? '🥋'}</span>
                      <span className="text-ink-primary font-bold text-sm capitalize">{s.type.replace('_', ' ')}</span>
                      <span className="ml-auto text-ink-secondary text-xs">⏱ {s.duration_min}min</span>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
