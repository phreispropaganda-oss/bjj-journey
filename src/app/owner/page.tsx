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

export default async function OwnerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminCheck } = await supabase
    .from('admin_users').select('user_id').eq('user_id', user.id).single()
  if (!adminCheck) redirect('/dashboard')

  const viewAsStudent = await isViewingAsStudent()

  // ── Métricas globais ──
  const [
    { data: users },
    { data: academies },
    { data: subscriptions },
    { data: completions },
    { data: attendance },
    { data: promotions },
    { data: members },
  ] = await Promise.all([
    supabase.from('profiles').select('id, name, username, belt_id, degrees, xp, streak, created_at, academy_name, is_public').order('created_at', { ascending: false }),
    supabase.from('academies').select('id, name, plan, active, city, created_at, student_limit').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('user_id, plan, status, created_at'),
    supabase.from('technique_completions').select('user_id, completed_at'),
    supabase.from('attendance').select('user_id, date'),
    supabase.from('belt_promotions').select('user_id, to_belt, promoted_at').order('promoted_at', { ascending: false }).limit(10),
    supabase.from('academy_members').select('academy_id, user_id, role'),
  ])

  const allUsers   = (users   ?? []) as { id: string; name: string; username: string; belt_id: string; degrees: number; xp: number; streak: number; created_at: string; academy_name: string | null; is_public: boolean }[]
  const allAcads   = (academies ?? []) as { id: string; name: string; plan: string; active: boolean; city: string | null; created_at: string; student_limit: number }[]
  const allSubs    = (subscriptions ?? []) as { user_id: string; plan: string; status: string }[]
  const allComps   = (completions ?? []) as { user_id: string; completed_at: string }[]
  const allAttend  = (attendance ?? []) as { user_id: string; date: string }[]
  const allPromos  = (promotions ?? []) as { user_id: string; to_belt: string; promoted_at: string }[]
  const allMembers = (members ?? []) as { academy_id: string; user_id: string; role: string }[]

  const now     = new Date()
  const ago24h  = new Date(now.getTime() - 86400000).toISOString()
  const ago7d   = new Date(now.getTime() - 7 * 86400000).toISOString()

  const proUsers       = allSubs.filter(s => s.plan !== 'free' && s.status === 'active').length
  const newUsers24h    = allUsers.filter(u => u.created_at > ago24h).length
  const newUsers7d     = allUsers.filter(u => u.created_at > ago7d).length
  const activeAcads    = allAcads.filter(a => a.active).length
  const comps24h       = allComps.filter(c => c.completed_at > ago24h).length
  const attendance7d   = allAttend.filter(a => a.date > ago7d.slice(0, 10)).length

  // Belt distribution
  const beltDist = allUsers.reduce<Record<string, number>>((acc, u) => {
    acc[u.belt_id] = (acc[u.belt_id] ?? 0) + 1; return acc
  }, {})

  const totalXP = allUsers.reduce((a, u) => a + (u.xp ?? 0), 0)

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Top bar */}
      <div className="bg-[#1A1A1A] border-b border-[#333] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#CC0000] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-[10px]">BR</span>
          </div>
          <span className="text-white font-black text-base">Owner Panel</span>
          <span className="bg-[#CC0000] text-white text-[10px] font-black rounded-full px-2 py-0.5 ml-1">OWNER</span>
        </div>
        <div className="flex items-center gap-2">
          <ViewAsStudentToggle active={viewAsStudent} variant="dark" />
          <Link href="/dashboard" className="text-[#666] text-sm">← App</Link>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto pb-10">

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Usuários total',     value: allUsers.length,   sub: `+${newUsers24h} hoje`,    color: '#CC0000' },
            { label: 'Novos esta semana',  value: newUsers7d,        sub: `+${newUsers24h} nas 24h`, color: '#F59E0B' },
            { label: 'Planos pagos',       value: proUsers,          sub: `de ${allUsers.length} usuários`, color: '#16A34A' },
            { label: 'Academias ativas',   value: activeAcads,       sub: `${allAcads.length} total`, color: '#2563EB' },
            { label: 'Técnicas 24h',       value: comps24h,          sub: `${allComps.length} total`, color: '#7C3AED' },
            { label: 'Treinos 7 dias',     value: attendance7d,      sub: `${allAttend.length} total`, color: '#0891B2' },
            { label: 'Promoções',          value: allPromos.length,  sub: 'histórico',               color: '#D97706' },
            { label: 'XP total plataforma',value: totalXP,           sub: 'somado',                  color: '#CC0000' },
          ].map(k => (
            <div key={k.label} className="bg-[#1A1A1A] rounded-2xl p-3.5 border border-[#2A2A2A]">
              <p className="text-3xl font-black" style={{ color: k.color }}>{k.value.toLocaleString()}</p>
              <p className="text-white text-xs font-bold mt-0.5">{k.label}</p>
              <p className="text-[#555] text-[10px] mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Belt distribution */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-3">Distribuição por faixa</p>
          <div className="space-y-2">
            {Object.entries(beltDist).sort((a, b) => b[1] - a[1]).map(([belt, count]) => {
              const pct = allUsers.length > 0 ? Math.round((count / allUsers.length) * 100) : 0
              return (
                <div key={belt} className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm flex-shrink-0 border border-white/10" style={{ background: BELT_COLOR[belt] }} />
                  <span className="text-white text-xs font-bold w-14">Faixa {BELT_NAME[belt] ?? belt}</span>
                  <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: BELT_COLOR[belt] }} />
                  </div>
                  <span className="text-[#666] text-xs w-12 text-right">{count} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Academias */}
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#555]">Academias</p>
            <Link href="/owner/academias/nova" className="text-[#CC0000] text-xs font-bold">+ Nova</Link>
          </div>
          {allAcads.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-[#555] text-sm mb-3">Nenhuma academia cadastrada</p>
              <Link href="/owner/academias/nova" className="inline-flex items-center gap-2 bg-[#CC0000] text-white text-sm font-bold px-4 py-2 rounded-full">
                + Cadastrar primeira academia
              </Link>
            </div>
          ) : allAcads.map(a => {
            const memberCount = allMembers.filter(m => m.academy_id === a.id).length
            return (
              <Link key={a.id} href={`/owner/academias/${a.id}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] hover:bg-[#222] transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.active ? 'bg-green-500' : 'bg-[#555]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{a.name}</p>
                  <p className="text-[#555] text-[11px]">{a.city ?? '—'} · {memberCount} alunos</p>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  a.plan === 'enterprise' ? 'bg-[#CC0000] text-white' :
                  a.plan === 'pro' ? 'bg-[#F59E0B] text-black' : 'bg-[#2A2A2A] text-[#555]'
                }`}>{a.plan.toUpperCase()}</span>
                <span className="text-[#555] text-sm">›</span>
              </Link>
            )
          })}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          <Link href="/owner/usuarios" className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-center hover:bg-[#222]">
            <p className="text-xl mb-1">👥</p>
            <p className="text-white text-xs font-black">Usuários</p>
          </Link>
          <Link href="/owner/academias/nova" className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-center hover:bg-[#222]">
            <p className="text-xl mb-1">🏢</p>
            <p className="text-white text-[10px] font-black">+ Academia</p>
          </Link>
          <Link href="/owner/desafios" className="bg-[#9E0B13]/15 border border-[#9E0B13]/40 rounded-xl p-3 text-center hover:bg-[#9E0B13]/25">
            <p className="text-xl mb-1">🎯</p>
            <p className="text-[#FF6B6B] text-xs font-black">Desafios</p>
          </Link>
          <Link href="/owner/moderacao" className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-3 text-center hover:bg-amber-500/25">
            <p className="text-xl mb-1">🛡️</p>
            <p className="text-amber-400 text-[11px] font-black">Moderação</p>
          </Link>
        </div>

        {/* Últimos usuários */}
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#555]">Usuários recentes</p>
            <Link href="/owner/usuarios" className="text-[#CC0000] text-xs font-bold">Ver todos →</Link>
          </div>
          {allUsers.slice(0, 8).map(u => {
            const sub = allSubs.find(s => s.user_id === u.id)
            return (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E]">
                <div className="w-8 h-8 rounded-full bg-[#CC0000] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                  {(u.name?.charAt(0) ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{u.name || 'Sem nome'}</p>
                  <p className="text-[#555] text-[11px]">@{u.username} · {u.xp} XP</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-3 h-2 rounded-sm border border-white/10" style={{ background: BELT_COLOR[u.belt_id] }} />
                  {sub && sub.plan !== 'free' && (
                    <span className="text-[10px] bg-[#CC0000] text-white px-1.5 py-0.5 rounded font-bold">{sub.plan}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Últimas promoções */}
        {allPromos.length > 0 && (
          <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2A2A2A]">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#555]">Últimas promoções</p>
            </div>
            {allPromos.map(p => {
              const u = allUsers.find(x => x.id === p.user_id)
              return (
                <div key={`${p.user_id}-${p.promoted_at}`}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1E1E1E]">
                  <span className="text-lg">🏅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{u?.name ?? 'Usuário'}</p>
                    <p className="text-[#555] text-[11px]">
                      Promovido para Faixa {BELT_NAME[p.to_belt] ?? p.to_belt} · {new Date(p.promoted_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="w-4 h-3 rounded-sm border border-white/10 flex-shrink-0" style={{ background: BELT_COLOR[p.to_belt] }} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
