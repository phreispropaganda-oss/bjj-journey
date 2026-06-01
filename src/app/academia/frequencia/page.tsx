'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const BELT_COLOR: Record<string, string> = {
  white:'#E8E8E8', blue:'#2563EB', purple:'#7C3AED', brown:'#92400E', black:'#1A1A1A',
}
const BELT_NAME: Record<string, string> = {
  white:'Branca', blue:'Azul', purple:'Roxa', brown:'Marrom', black:'Preta',
}

type Student = {
  id: string; name: string; username: string; belt_id: string; degrees: number;
  presentToday: boolean; totalTrains: number;
}

export default function FrequenciaPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [academyId, setAcademyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const today = new Date().toISOString().split('T')[0]
  const todayDisplay = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: mem } = await supabase
        .from('academy_members').select('academy_id').eq('user_id', user.id)
        .in('role', ['admin', 'instructor']).maybeSingle()
      const aId = (mem as { academy_id: string } | null)?.academy_id
      if (!aId) return
      setAcademyId(aId)

      const { data: members } = await supabase
        .from('academy_members')
        .select('user_id')
        .eq('academy_id', aId)
        .eq('role', 'student')
        .eq('active', true)

      const ids = ((members ?? []) as { user_id: string }[]).map(m => m.user_id)
      if (!ids.length) { setLoading(false); return }

      const [{ data: profiles }, { data: allAttend }, { data: todayAttend }] = await Promise.all([
        supabase.from('profiles').select('id, name, username, belt_id, degrees').in('id', ids),
        supabase.from('attendance').select('user_id').in('user_id', ids),
        supabase.from('attendance').select('user_id').in('user_id', ids).eq('date', today),
      ])

      const totalByUser = ((allAttend ?? []) as { user_id: string }[]).reduce<Record<string, number>>((a, x) => {
        a[x.user_id] = (a[x.user_id] ?? 0) + 1; return a
      }, {})
      const presentIds = new Set(((todayAttend ?? []) as { user_id: string }[]).map(x => x.user_id))

      const result: Student[] = ((profiles ?? []) as { id: string; name: string; username: string; belt_id: string; degrees: number }[]).map(p => ({
        ...p,
        presentToday: presentIds.has(p.id),
        totalTrains: totalByUser[p.id] ?? 0,
      }))

      setStudents(result.sort((a, b) => a.name?.localeCompare(b.name ?? '') ?? 0))
      setLoading(false)
    }
    load()
  }, [today])

  async function togglePresence(studentId: string, currentlyPresent: boolean) {
    setMarking(studentId)
    const supabase = createClient()

    if (currentlyPresent) {
      await supabase.from('attendance' as never)
        .delete().match({ user_id: studentId, date: today } as never)
    } else {
      await (supabase.from('attendance') as ReturnType<typeof supabase.from>)
        .insert({ user_id: studentId, date: today } as never)
    }

    setStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, presentToday: !currentlyPresent } : s
    ))
    setMarking(null)
  }

  async function markAllPresent() {
    const supabase = createClient()
    const absent = students.filter(s => !s.presentToday)
    for (const s of absent) {
      await (supabase.from('attendance') as ReturnType<typeof supabase.from>)
        .insert({ user_id: s.id, date: today } as never)
    }
    setStudents(prev => prev.map(s => ({ ...s, presentToday: true })))
  }

  const filtered = students.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase())
  )
  const presentCount = students.filter(s => s.presentToday).length

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Top bar */}
      <div className="bg-[#1A1A1A] border-b border-brand-elev px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/academia" className="text-ink-secondary text-sm">← Academia</Link>
          <h1 className="text-white font-black text-base flex-1">Confirmar Presenças</h1>
        </div>
        {/* Tabs */}
        <div className="flex gap-3 overflow-x-auto scrollbar-none mb-3">
          {[
            { href: '/academia',            label: '📊 Visão Geral' },
            { href: '/academia/alunos',     label: '👥 Alunos' },
            { href: '/academia/frequencia', label: '✅ Presenças' },
            { href: '/academia/promover',   label: '🏅 Promover' },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${
                t.href === '/academia/frequencia' ? 'bg-rise text-white' : 'bg-brand-elev text-ink-secondary'
              }`}>
              {t.label}
            </Link>
          ))}
        </div>
        <input
          className="w-full bg-brand-elev border border-brand-elev rounded-xl px-3 py-2 text-white text-sm outline-none placeholder:text-ink-muted focus:border-rise"
          placeholder="Buscar aluno..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto pb-10 space-y-4">

        {/* Date + summary */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <p className="text-ink-secondary text-xs font-bold uppercase tracking-wider mb-1">Aula de hoje</p>
          <p className="text-white font-black text-base capitalize">{todayDisplay}</p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-rise font-black text-2xl">{presentCount}</p>
                <p className="text-ink-secondary text-[10px]">presentes</p>
              </div>
              <div>
                <p className="text-ink-secondary font-black text-2xl">{students.length - presentCount}</p>
                <p className="text-ink-secondary text-[10px]">ausentes</p>
              </div>
              <div>
                <p className="text-white font-black text-2xl">{students.length}</p>
                <p className="text-ink-secondary text-[10px]">total</p>
              </div>
            </div>
            {presentCount < students.length && (
              <button onClick={markAllPresent}
                className="bg-rise text-white font-black text-xs px-4 py-2 rounded-full">
                ✅ Marcar todos
              </button>
            )}
          </div>
        </div>

        {/* Student list */}
        {loading ? (
          <div className="text-center py-8 text-ink-secondary">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-ink-secondary">
            {students.length === 0 ? 'Nenhum aluno cadastrado como "student".' : 'Nenhum aluno encontrado.'}
          </div>
        ) : (
          <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
            {filtered.map(s => (
              <div key={s.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-none">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                  style={{ background: BELT_COLOR[s.belt_id] ?? '#555',
                    color: s.belt_id === 'white' ? '#555' : 'white' }}>
                  {(s.name?.charAt(0) ?? '?').toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{s.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-2.5 h-2 rounded-sm border border-white/10"
                      style={{ background: BELT_COLOR[s.belt_id] }} />
                    <span className="text-ink-secondary text-[10px]">
                      Faixa {BELT_NAME[s.belt_id] ?? s.belt_id}
                    </span>
                    <span className="text-ink-muted text-[10px]">· {s.totalTrains} treinos</span>
                  </div>
                </div>

                {/* Present toggle */}
                <button
                  onClick={() => togglePresence(s.id, s.presentToday)}
                  disabled={marking === s.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-xs transition-all flex-shrink-0 ${
                    s.presentToday
                      ? 'bg-green-900/30 border border-green-700 text-green-400'
                      : 'bg-brand-elev border border-brand-elev text-ink-secondary'
                  }`}>
                  {marking === s.id ? (
                    <span className="animate-spin">⟳</span>
                  ) : s.presentToday ? (
                    <>✅ Presente</>
                  ) : (
                    <>○ Ausente</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
