import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient as createPublicClient } from '@supabase/supabase-js'
import { BELTS, getCurriculumByBelt, getTotalTechniques } from '@/lib/curriculum'
import { createClient } from '@/lib/supabase/server'
import ShareButton from '@/components/profile/ShareButton'
import Link from 'next/link'

interface Props { params: Promise<{ username: string }> }

const supabasePublic = createPublicClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BELT_COLOR: Record<string, string> = {
  white:'#E8E8E8', blue:'#2563EB', purple:'#7C3AED', brown:'#92400E', black:'#1A1A1A',
}
const BELT_NAME: Record<string, string> = {
  white:'Branca', blue:'Azul', purple:'Roxa', brown:'Marrom', black:'Preta',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bjj-journey-iota.vercel.app'
  const { data: p } = await supabasePublic
    .from('profiles').select('name, belt_id').eq('username', username).eq('is_public', true).single()
  const profile = p as { name: string; belt_id: string } | null
  return {
    title: profile ? `${profile.name} no Belt Rise` : 'Belt Rise — Perfil',
    description: `Veja a jornada de ${profile?.name ?? username} no jiu-jitsu`,
    openGraph: { images: [`${appUrl}/api/og?username=${username}`] },
    twitter: { card: 'summary_large_image', images: [`${appUrl}/api/og?username=${username}`] },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bjj-journey-iota.vercel.app'

  const { data: profileRaw } = await supabasePublic
    .from('profiles')
    .select('id, name, username, belt_id, degrees, xp, streak, academy_name, is_public')
    .eq('username', username)
    .eq('is_public', true)
    .single()

  if (!profileRaw) notFound()
  const profile = profileRaw as {
    id: string; name: string; username: string; belt_id: string; degrees: number;
    xp: number; streak: number; academy_name: string | null; is_public: boolean
  }

  const [
    { data: completionsRaw },
    { data: attendanceRaw },
    { data: promotionsRaw },
  ] = await Promise.all([
    supabasePublic.from('technique_completions').select('belt_id, module_id, technique_name, completed_at').eq('user_id', profile.id),
    supabasePublic.from('attendance').select('date').eq('user_id', profile.id).order('date', { ascending: false }).limit(90),
    supabasePublic.from('belt_promotions').select('from_belt, to_belt, to_degrees, promoted_at').eq('user_id', profile.id).order('promoted_at'),
  ])

  const completions = (completionsRaw ?? []) as { belt_id: string; module_id: string; technique_name: string; completed_at: string }[]
  const attendance  = (attendanceRaw ?? []) as { date: string }[]
  const promotions  = (promotionsRaw ?? []) as { from_belt: string; to_belt: string; to_degrees: number; promoted_at: string }[]

  const belt      = BELTS.find(b => b.id === profile.belt_id) ?? BELTS[0]
  const totalTech = getTotalTechniques(profile.belt_id as import('@/lib/supabase/types').BeltId)
  const doneTech  = completions.filter(c => c.belt_id === profile.belt_id).length
  const pct       = totalTech > 0 ? Math.round((doneTech / totalTech) * 100) : 0

  // Check if viewer is the owner (for edit button)
  let isOwner = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: own } = await supabase.from('profiles').select('username').eq('id', user.id).single()
      isOwner = (own as { username: string } | null)?.username === username
    }
  } catch { /* not logged in */ }

  // Attendance heatmap — last 52 weeks
  const attendSet = new Set(attendance.map(a => a.date))
  const today = new Date()
  const weeks: string[][] = []
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (52 * 7))
  startDate.setDate(startDate.getDate() - startDate.getDay())
  const cur = new Date(startDate)
  for (let w = 0; w < 52; w++) {
    const week: string[] = []
    for (let d = 0; d < 7; d++) {
      week.push(cur.toISOString().split('T')[0])
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }

  return (
    <div className="min-h-screen bg-[#F8F7F5]">
      {/* Hero — dark with red accent */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0D0D0D 0%, #1A1A1A 100%)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#CC0000] rounded-full opacity-10 -translate-y-1/2 translate-x-1/2" />

        <div className="px-5 pt-10 pb-6 relative z-10">
          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-[#CC0000] flex items-center justify-center text-white font-black text-2xl border-2 border-white/20 shadow-lg shadow-red-900/30">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight">{profile.name}</h1>
              {profile.academy_name && (
                <p className="text-white/50 text-sm mt-0.5">{profile.academy_name}</p>
              )}
              <p className="text-white/30 text-xs mt-0.5">@{profile.username}</p>
            </div>
            {isOwner && (
              <Link href="/dashboard" className="ml-auto text-[#CC0000] text-xs font-bold border border-[#CC0000]/30 px-2.5 py-1 rounded-full">
                Editar
              </Link>
            )}
          </div>

          {/* Belt + degrees */}
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-3 py-2.5 mb-4">
            <div className="flex-1 h-5 rounded overflow-hidden flex items-center" style={{ background: belt.color }}>
              <div className="flex-1" />
              {Array.from({ length: profile.degrees }).map((_, i) => (
                <div key={i} className="w-1.5 h-[65%] bg-white/70 rounded-sm mr-0.5" />
              ))}
              <div className="w-3 h-full bg-black/80" />
            </div>
            <span className="text-white font-black text-sm flex-shrink-0">Faixa {belt.name}</span>
            {profile.degrees > 0 && (
              <span className="text-white/40 text-xs">· {profile.degrees}° grau</span>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { n: attendance.length, l: 'Treinos' },
              { n: profile.xp, l: 'XP Total' },
              { n: doneTech, l: 'Técnicas' },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-white font-black text-xl leading-none">{s.n}</p>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3 pb-8">

        {/* Streak + progress */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🔥</span>
              <span className="font-black text-2xl text-[#0D0D0D]">{profile.streak}</span>
            </div>
            <p className="text-[#555] text-xs font-bold">Dias consecutivos</p>
          </div>
          <div className="bg-white rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-black text-lg" style={{ color: belt.color }}>{pct}%</span>
              <span className="text-[#AAA] text-[10px]">{doneTech}/{totalTech}</span>
            </div>
            <div className="h-1.5 bg-[#F2F0ED] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: belt.color }} />
            </div>
            <p className="text-[#555] text-xs font-bold mt-1.5">Progresso Faixa {belt.name}</p>
          </div>
        </div>

        {/* Attendance heatmap */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-3">Frequência — últimas 52 semanas</p>
          <div className="flex gap-0.5 overflow-x-auto scrollbar-none">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5 flex-shrink-0">
                {week.map(day => (
                  <div key={day} title={day}
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{
                      background: attendSet.has(day)
                        ? '#CC0000'
                        : day > today.toISOString().split('T')[0]
                          ? 'transparent'
                          : '#F2F0ED',
                    }} />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-[#AAA]">52 semanas atrás</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#F2F0ED]" />
              <p className="text-[10px] text-[#AAA]">0</p>
              <div className="w-2.5 h-2.5 rounded-sm bg-[#CC0000] ml-1" />
              <p className="text-[10px] text-[#AAA]">treino</p>
            </div>
          </div>
        </div>

        {/* Belt timeline */}
        {promotions.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-3">Jornada de faixas</p>
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-[#F2F0ED]" />
              {promotions.map((pr, i) => (
                <div key={i} className="relative mb-3 last:mb-0">
                  <div className="absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                    style={{ background: BELT_COLOR[pr.to_belt] ?? '#ccc' }} />
                  <p className="text-sm font-black text-[#0D0D0D]">Faixa {BELT_NAME[pr.to_belt] ?? pr.to_belt}, {pr.to_degrees}° grau</p>
                  <p className="text-[11px] text-[#AAA]">{new Date(pr.promoted_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                </div>
              ))}
              {/* Current */}
              <div className="relative">
                <div className="absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm animate-pulse"
                  style={{ background: belt.color }} />
                <p className="text-sm font-black" style={{ color: belt.color }}>Faixa {belt.name} — hoje</p>
                <p className="text-[11px] text-[#AAA]">Em evolução 🥋</p>
              </div>
            </div>
          </div>
        )}

        {/* Share */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-3">Compartilhar perfil</p>
          <ShareButton username={username} appUrl={appUrl} />
        </div>

        {/* CTA para visitantes */}
        {!isOwner && (
          <div className="bg-[#0D0D0D] rounded-2xl p-5 text-center">
            <p className="text-white font-black text-lg mb-1 tracking-tight">Comece sua jornada 🥋</p>
            <p className="text-white/50 text-sm mb-4">Acompanhe técnicas, presença e progresso igual a {profile.name}.</p>
            <Link href="/login"
              className="inline-block bg-[#CC0000] text-white font-black px-8 py-3 rounded-full text-sm hover:bg-[#A80000] transition-colors">
              Criar conta grátis
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
