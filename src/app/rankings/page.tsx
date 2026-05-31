import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/ui/BottomNav'
import SocialTabs from '@/components/feed/SocialTabs'

const BELT_COLOR: Record<string, string> = {
  white:'#E8E8E8', blue:'#2563EB', purple:'#7C3AED', brown:'#92400E', black:'#1A1A1A',
}
const BELT_NAME: Record<string, string> = {
  white:'Branca', blue:'Azul', purple:'Roxa', brown:'Marrom', black:'Preta',
}

type Tab = 'academy' | 'streak' | 'xp'

interface Props { searchParams: Promise<{ tab?: Tab }> }

interface ProfileLite {
  id: string; name: string; username: string;
  belt_id: string; degrees: number; academy_name: string | null;
  xp: number; streak: number;
}

const MONTH_LABEL = new Date().toLocaleDateString('pt-BR', { month: 'long' })

export default async function RankingsPage({ searchParams }: Props) {
  const { tab = 'academy' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get current user's academy
  const { data: memData } = await supabase
    .from('academy_members')
    .select('academy_id')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle()
  const myAcademyId = (memData as { academy_id: string } | null)?.academy_id ?? null

  let ranking: (ProfileLite & { value: number; rank: number; subLabel: string })[] = []
  let title = ''
  let subtitle = ''

  if (tab === 'academy') {
    title = '🏆 Rei do Tatame'
    subtitle = myAcademyId
      ? `Mais minutos na sua academia este mês (${MONTH_LABEL})`
      : 'Você ainda não está em uma academia'

    if (myAcademyId) {
      const { data: members } = await supabase
        .from('academy_members').select('user_id')
        .eq('academy_id', myAcademyId).eq('active', true)
      const ids = ((members ?? []) as { user_id: string }[]).map(m => m.user_id)

      if (ids.length > 0) {
        const [{ data: lb }, { data: profs }] = await Promise.all([
          supabase.from('leaderboard_monthly').select('*').in('user_id', ids),
          supabase.from('profiles')
            .select('id, name, username, belt_id, degrees, academy_name, xp, streak, is_public, active')
            .in('id', ids),
        ])
        const lbData = (lb ?? []) as { user_id: string; total_minutes: number; session_count: number }[]
        const lbMap = Object.fromEntries(lbData.map(l => [l.user_id, l]))
        const profList = (profs ?? []) as (ProfileLite & { is_public: boolean; active: boolean })[]
        const enriched = profList
          .filter(p => p.active && (p.is_public || p.id === user.id))
          .map(p => ({
            ...p,
            value: lbMap[p.id]?.total_minutes ?? 0,
            sessions: lbMap[p.id]?.session_count ?? 0,
          }))
          .sort((a, b) => b.value - a.value)
        ranking = enriched.map((p, i) => ({
          ...p,
          rank: i + 1,
          subLabel: `${p.sessions} treinos · ${p.value}min`,
        }))
      }
    }
  } else if (tab === 'streak') {
    title = '🔥 Top Sequências'
    subtitle = 'Maiores streaks ativas — apenas perfis públicos'
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, name, username, belt_id, degrees, academy_name, xp, streak, is_public, active')
      .gt('streak', 0)
      .eq('active', true)
      .order('streak', { ascending: false })
      .limit(80)
    const profList = ((profs ?? []) as (ProfileLite & { is_public: boolean; active: boolean })[])
      .filter(p => p.is_public || p.id === user.id)
      .slice(0, 50)
    ranking = profList.map((p, i) => ({
      ...p, value: p.streak, rank: i + 1, subLabel: `${p.streak} dias consecutivos`,
    }))
  } else {
    title = '⚡ Top XP'
    subtitle = 'Maiores XP acumulados — apenas perfis públicos'
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, name, username, belt_id, degrees, academy_name, xp, streak, is_public, active')
      .gt('xp', 0)
      .eq('active', true)
      .order('xp', { ascending: false })
      .limit(80)
    const profList = ((profs ?? []) as (ProfileLite & { is_public: boolean; active: boolean })[])
      .filter(p => p.is_public || p.id === user.id)
      .slice(0, 50)
    ranking = profList.map((p, i) => ({
      ...p, value: p.xp, rank: i + 1, subLabel: `${p.xp.toLocaleString()} XP totais`,
    }))
  }

  const myRank = ranking.find(r => r.id === user.id)?.rank ?? null

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#CC0000] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-[10px] tracking-tighter">BR</span>
          </div>
          <h1 className="font-black text-base tracking-tight">Rankings</h1>
        </div>
        {myRank && (
          <span className="bg-[#FFF0F0] text-[#CC0000] text-xs font-black px-2.5 py-1 rounded-full">
            Você está em #{myRank}
          </span>
        )}
      </div>
      <SocialTabs active="rankings" />

      {/* Inner tabs */}
      <div className="bg-white border-b border-[#E5E5E5] px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { tab: 'academy', label: '🏆 Academia' },
          { tab: 'streak',  label: '🔥 Sequência' },
          { tab: 'xp',      label: '⚡ XP' },
        ].map(t => (
          <Link key={t.tab} href={`/rankings?tab=${t.tab}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-black ${
              tab === t.tab ? 'bg-[#0D0D0D] text-white' : 'bg-[#F2F0ED] text-[#555]'
            }`}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pt-3 pb-24 space-y-2">
        {/* Hero / context */}
        <div className="bg-[#0D0D0D] rounded-2xl p-4 mb-2">
          <p className="text-white font-black text-base tracking-tight">{title}</p>
          <p className="text-white/50 text-xs mt-0.5">{subtitle}</p>
        </div>

        {/* Ranking list */}
        {ranking.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">🏆</p>
            <p className="font-black text-[#0D0D0D] text-lg mb-1">Sem dados ainda</p>
            <p className="text-[#888] text-sm">
              {tab === 'academy' && !myAcademyId
                ? 'Edite seu perfil para vincular uma academia.'
                : 'Seja o primeiro a aparecer no ranking!'}
            </p>
          </div>
        ) : (
          ranking.slice(0, 50).map(r => {
            const isMe = r.id === user.id
            const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : null
            return (
              <Link key={r.id} href={`/profile/${r.username}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  isMe ? 'bg-[#FFF0F0] border-2 border-[#CC0000]' :
                  r.rank <= 3 ? 'bg-white shadow-sm border border-[#FFE5E5]' :
                  'bg-white shadow-sm'
                }`}>
                {/* Rank */}
                <div className="w-9 flex items-center justify-center flex-shrink-0">
                  {medal ? (
                    <span className="text-2xl">{medal}</span>
                  ) : (
                    <span className="font-black text-[#888]">{r.rank}</span>
                  )}
                </div>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{
                    background: BELT_COLOR[r.belt_id] ?? '#888',
                    color: r.belt_id === 'white' ? '#0D0D0D' : 'white',
                  }}>
                  {(r.name?.charAt(0) ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-black text-sm text-[#0D0D0D] truncate">{r.name}</p>
                    {isMe && <span className="text-[10px] bg-[#CC0000] text-white px-1.5 py-0.5 rounded font-bold">VOCÊ</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2.5 h-1.5 rounded-sm border border-black/10" style={{ background: BELT_COLOR[r.belt_id] }} />
                    <span className="text-[10px] text-[#888]">Faixa {BELT_NAME[r.belt_id]}</span>
                    {r.academy_name && <span className="text-[10px] text-[#AAA] truncate">· {r.academy_name}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-base text-[#CC0000]">{r.value.toLocaleString()}</p>
                  <p className="text-[10px] text-[#AAA]">{r.subLabel.split('·')[0]}</p>
                </div>
              </Link>
            )
          })
        )}
      </div>

      <BottomNav active="feed" />
    </div>
  )
}
