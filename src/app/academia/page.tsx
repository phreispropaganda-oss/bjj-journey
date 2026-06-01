import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ViewAsStudentToggle from '@/components/ui/ViewAsStudentToggle'
import { isViewingAsStudent } from '@/lib/view-mode'

const BELT_COLOR: Record<string, string> = {
  white: '#E8E8E8', blue: '#2563EB', purple: '#7C3AED',
  brown: '#92400E', black: '#1A1A1A',
}
const BELT_NAME: Record<string, string> = {
  white: 'Branca', blue: 'Azul', purple: 'Roxa', brown: 'Marrom', black: 'Preta',
}

export default async function AcademiaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find academy where user is admin
  const { data: memberData } = await supabase
    .from('academy_members')
    .select('academy_id, role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'instructor'])
    .maybeSingle()

  const member = memberData as { academy_id: string; role: string } | null
  const isOwner = !!(await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()).data

  if (!member && !isOwner) redirect('/dashboard')

  const viewAsStudent = await isViewingAsStudent()

  // Owner without academy → prompt to create
  if (!member && isOwner) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">🏢</p>
          <h2 className="text-white font-black text-xl mb-2">Nenhuma academia vinculada</h2>
          <p className="text-ink-secondary text-sm mb-6">Crie uma academia primeiro no painel Owner.</p>
          <Link href="/owner/academias/nova" className="inline-block bg-rise text-white font-black px-6 py-3 rounded-full text-sm">
            Criar academia →
          </Link>
        </div>
      </div>
    )
  }

  const academyId = member!.academy_id

  const [
    { data: academy },
    { data: allMembers },
    { data: recentAttend },
    { data: promotions },
  ] = await Promise.all([
    supabase.from('academies').select('*').eq('id', academyId).single(),
    supabase.from('academy_members')
      .select('user_id, role, plan_override, joined_at, active')
      .eq('academy_id', academyId)
      .order('joined_at', { ascending: false }),
    supabase.from('attendance')
      .select('user_id, date')
      .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
    supabase.from('belt_promotions')
      .select('user_id, to_belt, to_degrees, promoted_at')
      .eq('academy_id', academyId)
      .order('promoted_at', { ascending: false })
      .limit(5),
  ])

  const acad    = academy as Record<string, unknown> | null
  const members = (allMembers ?? []) as { user_id: string; role: string; plan_override: string | null; joined_at: string; active: boolean }[]
  const attend  = (recentAttend ?? []) as { user_id: string; date: string }[]
  const promos  = (promotions ?? []) as { user_id: string; to_belt: string; to_degrees: number; promoted_at: string }[]

  // Get all member profiles
  const memberIds = members.map(m => m.user_id)
  const { data: profilesData } = memberIds.length > 0
    ? await supabase.from('profiles').select('id, name, username, belt_id, degrees, xp, streak').in('id', memberIds)
    : { data: [] }
  const profiles = (profilesData ?? []) as { id: string; name: string; username: string; belt_id: string; degrees: number; xp: number; streak: number }[]

  const attend30d = attend.reduce<Record<string, number>>((acc, a) => {
    acc[a.user_id] = (acc[a.user_id] ?? 0) + 1; return acc
  }, {})

  const activeMembers = members.filter(m => m.active).length
  const avgAttend = activeMembers > 0
    ? Math.round(Object.values(attend30d).reduce((a, b) => a + b, 0) / activeMembers)
    : 0

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Top bar */}
      <div className="bg-[#1A1A1A] border-b border-brand-elev px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-ink-secondary font-bold uppercase tracking-wider">Painel Academia</p>
            <h1 className="text-white font-black text-base">{acad?.name as string ?? '—'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ViewAsStudentToggle active={viewAsStudent} variant="dark" />
            <Link href="/dashboard" className="text-ink-secondary text-sm">← App</Link>
          </div>
        </div>
        {/* Tab nav */}
        <div className="flex gap-3 mt-3 overflow-x-auto scrollbar-none">
          {[
            { href: '/academia',            label: '📊 Visão Geral' },
            { href: '/academia/alunos',     label: '👥 Alunos' },
            { href: '/academia/frequencia', label: '✅ Presenças' },
            { href: '/academia/promover',   label: '🏅 Promover' },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                t.href === '/academia'
                  ? 'bg-rise text-white'
                  : 'bg-brand-elev text-ink-secondary'
              }`}>
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto pb-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: activeMembers, l: 'Alunos', c: '#CC0000' },
            { v: avgAttend,     l: 'Média 30d', c: '#F59E0B' },
            { v: promos.length, l: 'Promoções', c: '#16A34A' },
          ].map(s => (
            <div key={s.l} className="bg-[#1A1A1A] rounded-2xl p-3 text-center border border-[#2A2A2A]">
              <p className="text-2xl font-black" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[10px] text-ink-secondary font-bold mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Plano da academia */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A] flex items-center justify-between">
          <div>
            <p className="text-ink-secondary text-xs font-bold">Plano atual</p>
            <p className="text-white font-black text-lg capitalize">{acad?.plan as string ?? 'free'}</p>
            <p className="text-ink-secondary text-xs">{activeMembers} / {acad?.student_limit as number} alunos</p>
          </div>
          <div className="text-right">
            <div className="w-20 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden mb-1">
              <div className="h-full bg-rise rounded-full"
                style={{ width: `${Math.min(100, (activeMembers / ((acad?.student_limit as number) ?? 30)) * 100)}%` }} />
            </div>
            <Link href="/pricing" className="text-rise text-xs font-bold">Upgrade →</Link>
          </div>
        </div>

        {/* Top alunos por frequência */}
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary">Top frequência (30 dias)</p>
            <Link href="/academia/alunos" className="text-rise text-xs font-bold">Ver todos →</Link>
          </div>
          {profiles.sort((a, b) => (attend30d[b.id] ?? 0) - (attend30d[a.id] ?? 0))
            .slice(0, 6)
            .map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1E1E1E]">
                <span className="text-ink-secondary text-xs font-black w-4">{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-rise flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                  {(p.name?.charAt(0) ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{p.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-3 h-2 rounded-sm border border-white/10" style={{ background: BELT_COLOR[p.belt_id] }} />
                    <span className="text-ink-secondary text-[10px]">Faixa {BELT_NAME[p.belt_id]}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-rise font-black text-sm">{attend30d[p.id] ?? 0}</p>
                  <p className="text-ink-secondary text-[10px]">treinos</p>
                </div>
              </div>
            ))}
        </div>

        {/* Últimas promoções */}
        {promos.length > 0 && (
          <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2A2A2A]">
              <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary">Últimas promoções</p>
            </div>
            {promos.map(pr => {
              const p = profiles.find(x => x.id === pr.user_id)
              return (
                <div key={`${pr.user_id}-${pr.promoted_at}`}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1E1E1E]">
                  <span className="text-xl">🏅</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold">{p?.name ?? 'Aluno'}</p>
                    <p className="text-ink-secondary text-[11px]">
                      Faixa {BELT_NAME[pr.to_belt]}, {pr.to_degrees}° grau · {new Date(pr.promoted_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="w-4 h-3 rounded-sm border border-white/10" style={{ background: BELT_COLOR[pr.to_belt] }} />
                </div>
              )
            })}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          <Link href="/academia/frequencia"
            className="bg-rise/10 border border-rise/30 rounded-2xl p-3 flex flex-col items-center gap-1 text-center">
            <span className="text-xl">✅</span>
            <p className="text-rise font-black text-xs">Presenças</p>
          </Link>
          <Link href="/academia/promover"
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-3 flex flex-col items-center gap-1 text-center">
            <span className="text-xl">🥋</span>
            <p className="text-white font-black text-xs">Promover</p>
          </Link>
          <Link href="/owner/desafios"
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-3 flex flex-col items-center gap-1 text-center">
            <span className="text-xl">🎯</span>
            <p className="text-white font-black text-xs">Desafios</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
