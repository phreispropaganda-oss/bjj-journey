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
const PLANS = ['free', 'pro', 'academy'] as const

type Student = {
  id: string; name: string; username: string; belt_id: string; degrees: number;
  xp: number; streak: number;
  member_role: string; member_active: boolean; plan_override: string | null;
  trains30d: number;
}

export default function AlunosPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [academyId, setAcademyId] = useState<string | null>(null)
  const [studentLimit, setStudentLimit] = useState<number>(10)
  const [academyPlan, setAcademyPlan] = useState<string>('free')
  const [search, setSearch] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [addMsg, setAddMsg] = useState('')
  const [selected, setSelected] = useState<Student | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: mem } = await supabase
        .from('academy_members').select('academy_id').eq('user_id', user.id)
        .in('role', ['admin','instructor']).maybeSingle()
      const aId = (mem as { academy_id: string } | null)?.academy_id
      if (!aId) return
      setAcademyId(aId)

      // Get academy plan + limit
      const { data: acad } = await supabase.from('academies')
        .select('plan, student_limit').eq('id', aId).single()
      const ac = acad as { plan: string; student_limit: number } | null
      if (ac) {
        setAcademyPlan(ac.plan)
        setStudentLimit(ac.student_limit)
      }

      const { data: members } = await supabase
        .from('academy_members')
        .select('user_id, role, plan_override, active')
        .eq('academy_id', aId)

      const memberList = (members ?? []) as { user_id: string; role: string; plan_override: string | null; active: boolean }[]
      const ids = memberList.map(m => m.user_id)
      if (!ids.length) { setLoading(false); return }

      const [{ data: profiles }, { data: attend }] = await Promise.all([
        supabase.from('profiles').select('id, name, username, belt_id, degrees, xp, streak').in('id', ids),
        supabase.from('attendance').select('user_id, date')
          .in('user_id', ids)
          .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
      ])

      const trains30d = ((attend ?? []) as { user_id: string; date: string }[]).reduce<Record<string, number>>((a, x) => {
        a[x.user_id] = (a[x.user_id] ?? 0) + 1; return a
      }, {})

      const result: Student[] = ((profiles ?? []) as { id: string; name: string; username: string; belt_id: string; degrees: number; xp: number; streak: number }[]).map(p => {
        const m = memberList.find(x => x.user_id === p.id)!
        return { ...p, member_role: m.role, member_active: m.active, plan_override: m.plan_override, trains30d: trains30d[p.id] ?? 0 }
      })
      setStudents(result.sort((a, b) => b.trains30d - a.trains30d))
      setLoading(false)
    }
    load()
  }, [])

  async function addStudent() {
    if (!addEmail.trim() || !academyId) return

    const activeStudents = students.filter(s => s.member_active && s.member_role === 'student').length
    if (activeStudents >= studentLimit) {
      setAddMsg(`⚠️ Limite atingido (${studentLimit} alunos no plano ${academyPlan.toUpperCase()}). Faça upgrade para adicionar mais.`)
      return
    }

    setAdding(true); setAddMsg('')
    const supabase = createClient()
    const query = addEmail.trim().replace(/^@/, '')

    // Use RPC lookup that searches across username AND email (returns auth.users.email)
    const { data: results, error: rpcErr } = await (supabase as unknown as {
      rpc: (n: string, p: Record<string, string>) => Promise<{
        data: { id: string; name: string; username: string; email: string }[] | null
        error: { message: string } | null
      }>
    }).rpc('lookup_user_for_academy', { p_query: query })

    if (rpcErr) { setAddMsg(`⚠️ ${rpcErr.message}`); setAdding(false); return }
    const found = results ?? []
    if (found.length === 0) {
      setAddMsg(`⚠️ Nenhum usuário encontrado para "${query}". O aluno precisa ter conta no Belt Rise.`)
      setAdding(false); return
    }
    // Exact match preferred; otherwise take first result
    const exact = found.find(f =>
      f.username?.toLowerCase() === query.toLowerCase() ||
      f.email?.toLowerCase()    === query.toLowerCase()
    )
    const profile = exact ?? found[0]

    // Already a member?
    if (students.some(s => s.id === profile.id)) {
      setAddMsg(`⚠️ ${profile.name} já está cadastrado nesta academia.`)
      setAdding(false); return
    }

    const { error } = await (supabase.from('academy_members') as ReturnType<typeof supabase.from>).upsert({
      academy_id: academyId, user_id: profile.id, role: 'student', active: true,
    } as never)
    if (error) {
      setAddMsg(`⚠️ ${error.message}`)
      setAdding(false); return
    }
    setAddMsg(`✅ ${profile.name} (@${profile.username}) adicionado!`)
    setAddEmail(''); setAdding(false)
    setTimeout(() => window.location.reload(), 1200)
  }

  async function updateStudent(studentId: string, field: string, value: string | boolean) {
    if (!academyId) return
    setSaving(true)
    const supabase = createClient()
    await (supabase.from('academy_members') as ReturnType<typeof supabase.from>)
      .update({ [field]: value } as never)
      .match({ academy_id: academyId, user_id: studentId } as never)
    setSaving(false)
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, [field === 'plan_override' ? 'plan_override' : 'member_active']: value } : s))
    setSelected(prev => prev?.id === studentId ? { ...prev, [field === 'plan_override' ? 'plan_override' : 'member_active']: value } : prev)
  }

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-[#1A1A1A] border-b border-brand-elev px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/academia" className="text-ink-secondary text-sm">← Academia</Link>
          <h1 className="text-white font-black text-base flex-1">Alunos</h1>
          <span className="bg-[#2A2A2A] text-ink-secondary text-xs px-2 py-0.5 rounded-full font-bold">{students.length}</span>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-none mb-3">
          {[
            { href: '/academia',            label: '📊 Visão Geral' },
            { href: '/academia/alunos',     label: '👥 Alunos' },
            { href: '/academia/frequencia', label: '✅ Presenças' },
            { href: '/academia/promover',   label: '🏅 Promover' },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${
                t.href === '/academia/alunos' ? 'bg-rise text-white' : 'bg-brand-elev text-ink-secondary'
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

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto pb-10">
        {/* Capacity indicator */}
        {(() => {
          const activeCount = students.filter(s => s.member_active && s.member_role === 'student').length
          const pct = Math.min(100, (activeCount / studentLimit) * 100)
          const atLimit = activeCount >= studentLimit
          return (
            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary">Capacidade</p>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  atLimit ? 'bg-red-900/40 text-red-400' :
                  pct > 80 ? 'bg-yellow-900/40 text-yellow-400' :
                  'bg-green-900/40 text-green-400'
                }`}>
                  Plano {academyPlan.toUpperCase()}
                </span>
              </div>
              <div className="flex items-end justify-between mb-1.5">
                <span className="text-white font-black text-2xl">
                  {activeCount}<span className="text-base text-ink-secondary"> / {studentLimit === 9999 ? '∞' : studentLimit}</span>
                </span>
                <span className="text-ink-secondary text-xs">alunos ativos</span>
              </div>
              <div className="h-2 bg-brand-elev rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${
                  atLimit ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-rise'
                }`} style={{ width: `${pct}%` }} />
              </div>
              {atLimit && (
                <p className="text-[10px] text-red-400 mt-2">⚠️ Limite atingido. Fale com o owner para upgrade.</p>
              )}
            </div>
          )
        })()}

        {/* Add student */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary mb-3">+ Adicionar aluno</p>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-brand-elev border border-brand-elev rounded-xl px-3 py-2 text-white text-sm outline-none placeholder:text-ink-muted focus:border-rise"
              placeholder="@username ou email@dominio.com"
              value={addEmail}
              onChange={e => setAddEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addStudent()}
            />
            <button onClick={addStudent} disabled={adding}
              className="bg-rise text-white font-black px-4 py-2 rounded-xl text-sm disabled:opacity-50">
              {adding ? '...' : 'Adicionar'}
            </button>
          </div>
          {addMsg && <p className="text-sm mt-2 text-ink-muted">{addMsg}</p>}
          <p className="text-[10px] text-ink-secondary mt-2">Busque pelo @username ou pelo email do aluno (precisa ter conta no Belt Rise).</p>
        </div>

        {/* Students list */}
        {loading ? (
          <div className="text-center py-8 text-ink-secondary">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-ink-secondary">Nenhum aluno encontrado</div>
        ) : (
          <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
            {filtered.map(s => (
              <div key={s.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] cursor-pointer hover:bg-brand-elev"
                onClick={() => setSelected(s)}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.member_active ? 'bg-green-500' : 'bg-[#555]'}`} />
                <div className="w-8 h-8 rounded-full bg-rise flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                  {(s.name?.charAt(0) ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{s.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-3 h-2 rounded-sm border border-white/10" style={{ background: BELT_COLOR[s.belt_id] }} />
                    <span className="text-ink-secondary text-[10px]">Faixa {BELT_NAME[s.belt_id]}, {s.degrees}° grau</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-rise font-black text-sm">{s.trains30d}</p>
                  <p className="text-ink-secondary text-[10px]">treinos/30d</p>
                </div>
                {s.plan_override && s.plan_override !== 'free' && (
                  <span className="text-[10px] bg-rise text-white px-1.5 py-0.5 rounded font-bold">{s.plan_override}</span>
                )}
                <span className="text-ink-secondary text-sm">›</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center"
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="bg-[#1A1A1A] w-full max-w-[480px] rounded-t-3xl p-5 border-t border-[#2A2A2A]"
            style={{ animation: 'slideUp .25s ease' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rise flex items-center justify-center text-white font-black">
                  {(selected.name?.charAt(0) ?? '?').toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-black">{selected.name}</p>
                  <p className="text-ink-secondary text-xs">@{selected.username}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-ink-secondary text-xl">✕</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { l: 'XP', v: selected.xp },
                { l: 'Treinos 30d', v: selected.trains30d },
                { l: 'Sequência', v: `${selected.streak}d` },
              ].map(s => (
                <div key={s.l} className="bg-brand-elev rounded-xl p-2.5 text-center">
                  <p className="text-white font-black text-lg">{s.v}</p>
                  <p className="text-ink-secondary text-[10px]">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Plano override */}
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary mb-2">Plano do aluno</p>
              <div className="flex gap-2">
                {(['free', 'pro', 'academy'] as const).map(p => (
                  <button key={p} disabled={saving}
                    onClick={() => updateStudent(selected.id, 'plan_override', p)}
                    className={`flex-1 py-2 rounded-xl border-2 text-xs font-black transition-all ${
                      (selected.plan_override ?? 'free') === p
                        ? 'border-rise bg-rise/10 text-rise'
                        : 'border-brand-elev text-ink-secondary'
                    }`}>
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Status ativo */}
            <div className="flex items-center justify-between p-3 bg-brand-elev rounded-xl mb-4">
              <p className="text-white text-sm font-bold">Aluno ativo</p>
              <button
                onClick={() => updateStudent(selected.id, 'active', !selected.member_active)}
                className={`w-12 h-6 rounded-full transition-colors relative ${selected.member_active ? 'bg-rise' : 'bg-[#333]'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${selected.member_active ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <Link href="/academia/promover"
              className="w-full block text-center bg-rise text-white font-black py-3 rounded-full text-sm">
              🏅 Promover faixa/grau
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
