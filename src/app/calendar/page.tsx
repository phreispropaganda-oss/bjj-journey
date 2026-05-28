'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/ui/BottomNav'

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function CalendarPage() {
  const [present, setPresent] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [today] = useState(new Date())
  const [cur, setCur] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() })
  const [marking, setMarking] = useState(false)

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const todayStr = fmt(today)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('attendance').select('date').eq('user_id', user.id)
      setPresent(new Set((data ?? []).map((r: { date: string }) => r.date)))
      setLoading(false)
    }
    load()
  }, [])

  async function toggleDay(dateStr: string) {
    if (dateStr > todayStr) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || marking) return
    setMarking(true)

    if (present.has(dateStr)) {
      await supabase.from('attendance' as never).delete().match({ user_id: user.id, date: dateStr } as never)
      setPresent(p => { const n = new Set(p); n.delete(dateStr); return n })
    } else {
      await (supabase.from('attendance') as ReturnType<typeof supabase.from>).insert({ user_id: user.id, date: dateStr } as never)
      setPresent(p => new Set([...p, dateStr]))
    }
    setMarking(false)
  }

  // Streak calculation
  const streak = (() => {
    let s = 0
    const d = new Date(todayStr)
    while (present.has(fmt(d))) { s++; d.setDate(d.getDate() - 1) }
    return s
  })()

  // Month stats
  const monthDays = Array.from(present).filter(d => d.startsWith(`${cur.y}-${String(cur.m + 1).padStart(2, '0')}`))
  const totalTrains = present.size
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay())
  const weekTrains = Array.from(present).filter(d => new Date(d) >= weekStart).length

  // Calendar grid
  const firstDay = new Date(cur.y, cur.m, 1).getDay()
  const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate()

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col">
      <div className="bg-white border-b border-[#E5E5E5] px-4 py-3 flex-shrink-0">
        <h1 className="text-lg font-black tracking-tight">Presenças</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pt-4 pb-24">
        {/* Streak hero */}
        <div className="rounded-2xl p-4 mb-3 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #CC0000, #E52222)' }}>
          <div className="text-4xl">🔥</div>
          <div className="text-white">
            <p className="text-4xl font-black leading-none">{streak}</p>
            <p className="text-sm font-bold opacity-90">dias consecutivos</p>
            <p className="text-xs opacity-60 mt-0.5">{totalTrains} treinos registrados</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { n: monthDays.length, l: 'Este mês' },
            { n: totalTrains,      l: 'Total' },
            { n: weekTrains,       l: 'Esta semana' },
          ].map(s => (
            <div key={s.l} className="bg-white rounded-2xl p-3 text-center shadow-sm">
              <p className="text-2xl font-black text-[#CC0000]">{s.n}</p>
              <p className="text-[10px] text-[#AAA] font-bold uppercase tracking-wide mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCur(c => c.m === 0 ? { y: c.y-1, m: 11 } : { ...c, m: c.m-1 })}
              className="w-8 h-8 rounded-full bg-[#FFF0F0] flex items-center justify-center text-[#CC0000] font-bold">‹</button>
            <p className="font-black text-base">{MONTHS[cur.m]} {cur.y}</p>
            <button onClick={() => setCur(c => c.m === 11 ? { y: c.y+1, m: 0 } : { ...c, m: c.m+1 })}
              className="w-8 h-8 rounded-full bg-[#FFF0F0] flex items-center justify-center text-[#CC0000] font-bold">›</button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-black text-[#AAA] uppercase py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateStr = `${cur.y}-${String(cur.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday    = dateStr === todayStr
              const isPresent  = present.has(dateStr)
              const isFuture   = dateStr > todayStr
              return (
                <button key={day}
                  onClick={() => toggleDay(dateStr)}
                  disabled={isFuture || marking}
                  className={`aspect-square rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${isPresent  ? 'bg-[#CC0000] text-white shadow-sm shadow-red-900/20' : ''}
                    ${isToday && !isPresent ? 'border-2 border-[#CC0000] text-[#CC0000]' : ''}
                    ${!isPresent && !isToday ? 'text-[#555] hover:bg-[#FFF0F0]' : ''}
                    ${isFuture ? 'text-[#DDD] cursor-default' : ''}
                  `}>
                  {day}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mark today */}
        {!present.has(todayStr) && (
          <button onClick={() => toggleDay(todayStr)}
            className="btn-primary">
            🥋 Marcar presença hoje
          </button>
        )}
        {present.has(todayStr) && (
          <div className="flex items-center justify-center gap-2 py-3 text-[#16A34A] font-black text-sm">
            <span className="text-xl">✅</span> Treino de hoje registrado!
          </div>
        )}
      </div>

      <BottomNav active="calendar" />
    </div>
  )
}
