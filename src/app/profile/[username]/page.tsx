import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient as createPublicClient } from '@supabase/supabase-js'
import { BELTS, getCurriculumByBelt, getTotalTechniques } from '@/lib/curriculum'
import { createClient } from '@/lib/supabase/server'
import ShareButton from '@/components/profile/ShareButton'
import FollowButton from '@/components/profile/FollowButton'
import ProfileHighlights from '@/components/profile/ProfileHighlights'
import ProfileTimeline from '@/components/profile/ProfileTimeline'
import ProfilePosts from '@/components/profile/ProfilePosts'
import LevelBadge from '@/components/profile/LevelBadge'
import MonthlyCalendar from '@/components/profile/MonthlyCalendar'
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
    .select('id, name, username, belt_id, degrees, xp, streak, academy_name, is_public, avatar_url, bio, weight_kg, height_cm, years_training, active, belt_verified_status')
    .eq('username', username)
    .eq('is_public', true)
    .single()

  if (!profileRaw) notFound()
  const profile = profileRaw as {
    id: string; name: string; username: string; belt_id: string; degrees: number;
    xp: number; streak: number; academy_name: string | null; is_public: boolean;
    avatar_url: string | null; bio: string | null;
    weight_kg: number | null; height_cm: number | null; years_training: number | null;
    active: boolean; belt_verified_status: string;
  }
  if (!profile.active) notFound()

  const [
    { data: completionsRaw },
    { data: attendanceRaw },
    { data: promotionsRaw },
    { data: caloriesRaw },
    { data: mostTrainedRaw },
  ] = await Promise.all([
    supabasePublic.from('technique_completions').select('belt_id, module_id, technique_name, completed_at').eq('user_id', profile.id),
    supabasePublic.from('attendance').select('date').eq('user_id', profile.id).order('date', { ascending: false }).limit(90),
    supabasePublic.from('belt_promotions').select('from_belt, to_belt, to_degrees, promoted_at').eq('user_id', profile.id).order('promoted_at'),
    (supabasePublic as unknown as { rpc: (n: string, p: Record<string, string>) => Promise<{ data: number | null }> })
      .rpc('total_calories', { p_user_id: profile.id }),
    (supabasePublic as unknown as { rpc: (n: string, p: Record<string, string>) => Promise<{ data: string | null }> })
      .rpc('most_trained_position', { p_user_id: profile.id }),
  ])

  const completions = (completionsRaw ?? []) as { belt_id: string; module_id: string; technique_name: string; completed_at: string }[]
  const attendance  = (attendanceRaw ?? []) as { date: string }[]
  const promotions  = (promotionsRaw ?? []) as { from_belt: string; to_belt: string; to_degrees: number; promoted_at: string }[]
  const calories    = (caloriesRaw as unknown as number) ?? 0
  const mostTrained = (mostTrainedRaw as unknown as string) ?? null

  const [
    { data: sessionsRaw },
    { count: followersCount },
    { count: followingCount },
    { data: weightClassRaw },
    { count: sessionCount },
  ] = await Promise.all([
    supabasePublic.from('training_sessions')
      .select('id, type, duration_min, trained_at')
      .eq('user_id', profile.id)
      .neq('visibility', 'private')
      .gte('trained_at', new Date(Date.now() - 90 * 86400000).toISOString())
      .order('trained_at', { ascending: false }),
    supabasePublic.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabasePublic.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', profile.id),
    profile.weight_kg
      ? (supabasePublic as unknown as { rpc: (n: string, p: Record<string, number>) => Promise<{ data: string | null }> })
          .rpc('weight_class', { p_kg: profile.weight_kg })
      : Promise.resolve({ data: null }),
    supabasePublic.from('training_sessions').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
  ])

  const totalMinutes = ((sessionsRaw ?? []) as { duration_min: number }[])
    .reduce((sum, s) => sum + (s.duration_min ?? 0), 0)
  const totalHours = Math.round(totalMinutes / 60)
  const uniqueDays = new Set(attendance.map(a => a.date)).size
  const weightClass = weightClassRaw as unknown as string | null
  const totalSessions = sessionCount ?? 0

  // Selo: maior frequência da academia (atual streak >= 7)
  const hasStreakBadge = (profile.streak ?? 0) >= 7

  const belt      = BELTS.find(b => b.id === profile.belt_id) ?? BELTS[0]
  const totalTech = getTotalTechniques(profile.belt_id as import('@/lib/supabase/types').BeltId)
  const doneTech  = completions.filter(c => c.belt_id === profile.belt_id).length
  const pct       = totalTech > 0 ? Math.round((doneTech / totalTech) * 100) : 0

  // Check viewer identity & social state
  let isOwner = false
  let viewerId: string | null = null
  let isFollowing = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      viewerId = user.id
      const { data: own } = await supabase.from('profiles').select('username').eq('id', user.id).single()
      isOwner = (own as { username: string } | null)?.username === username
      if (!isOwner) {
        const { data: f } = await supabase
          .from('follows').select('follower_id')
          .eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle()
        isFollowing = !!f
      }
    }
  } catch { /* not logged in */ }

  // Counts of follows
  const { count: followerCount } = await supabasePublic
    .from('follows').select('follower_id', { count: 'exact', head: true })
    .eq('following_id', profile.id)

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
          {/* Avatar central (estilo WhatsApp) */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white/20 shadow-2xl shadow-red-900/40" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-[#CC0000] flex items-center justify-center text-white font-black text-5xl border-4 border-white/20 shadow-2xl shadow-red-900/40">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              {hasStreakBadge && (
                <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-base shadow-lg border-2 border-[#0D0D0D]" title={`${profile.streak} dias consecutivos`}>
                  🔥
                </div>
              )}
            </div>
            <h1 className="text-white font-black text-2xl tracking-tight mt-4 text-center">{profile.name}</h1>
            <p className="text-white/30 text-xs mt-0.5">@{profile.username}</p>
            {profile.bio && (
              <p className="text-white/70 text-sm mt-2 text-center max-w-xs leading-relaxed">{profile.bio}</p>
            )}
            {profile.academy_name && (
              <p className="text-white/50 text-xs mt-2 flex items-center gap-1">
                <span>🏢</span> {profile.academy_name}
              </p>
            )}

            {/* Follow / Edit action */}
            <div className="mt-4">
              {isOwner ? (
                <Link href="/profile" className="text-[#CC0000] text-xs font-bold border border-[#CC0000]/30 px-4 py-1.5 rounded-full inline-block">
                  ✏️ Editar perfil
                </Link>
              ) : viewerId ? (
                <FollowButton
                  targetUserId={profile.id}
                  initialFollowing={isFollowing}
                  initialCount={followersCount ?? 0}
                />
              ) : null}
            </div>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
            {weightClass && (
              <span className="bg-white/10 backdrop-blur text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/20">
                ⚖️ {weightClass} · {profile.weight_kg}kg
              </span>
            )}
            {(profile.years_training ?? 0) >= 5 && (
              <span className="bg-yellow-500/20 text-yellow-300 text-[10px] font-black px-2.5 py-1 rounded-full border border-yellow-500/40">
                ⭐ Veterano · {profile.years_training}+ anos
              </span>
            )}
            {totalSessions >= 100 && (
              <span className="bg-[#CC0000]/30 text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-[#CC0000]/50">
                🏆 +{Math.floor(totalSessions / 100) * 100} treinos
              </span>
            )}
            {hasStreakBadge && (
              <span className="bg-orange-500/20 text-orange-300 text-[10px] font-black px-2.5 py-1 rounded-full border border-orange-500/40">
                🔥 Maior frequência · {profile.streak}d
              </span>
            )}
          </div>

          {/* Followers / following counts */}
          <div className="flex items-center justify-center gap-6 mb-4 py-3 border-y border-white/10">
            <div className="text-center">
              <p className="text-white font-black text-lg leading-none">{(followersCount ?? 0).toLocaleString()}</p>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">Seguidores</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-white font-black text-lg leading-none">{(followingCount ?? 0).toLocaleString()}</p>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">Seguindo</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-white font-black text-lg leading-none">{totalSessions.toLocaleString()}</p>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">Treinos</p>
            </div>
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
            {profile.belt_verified_status === 'verified' && (
              <span title="Faixa verificada pelo professor" className="text-[#DEFF9A] text-sm flex-shrink-0">✓</span>
            )}
            {profile.degrees > 0 && (
              <span className="text-white/40 text-xs">· {profile.degrees}° grau</span>
            )}
          </div>

          {/* Stats row — métricas BJJ */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { n: uniqueDays,                  l: 'Dias treino' },
              { n: `${totalHours}h`,            l: 'No tatame'   },
              { n: calories.toLocaleString(),   l: 'Kcal'        },
              { n: doneTech,                    l: 'Técnicas'    },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-white font-black text-base leading-none">{s.n}</p>
                <p className="text-white/40 text-[9px] uppercase tracking-wider mt-1">{s.l}</p>
              </div>
            ))}
          </div>

          {mostTrained && (
            <div className="mt-3 bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-lg">🥋</span>
              <div className="flex-1 min-w-0">
                <p className="text-white/40 text-[9px] uppercase tracking-wider">Posição mais treinada</p>
                <p className="text-white text-sm font-bold truncate">{mostTrained}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sprint P0.1 — Destaques */}
      <ProfileHighlights userId={profile.id} beltId={profile.belt_id} degrees={profile.degrees} />

      {/* Sprint P1.6 — Nível XP */}
      <div className="px-4 mt-3">
        <LevelBadge userId={profile.id} />
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

        {/* Bloco 7 — Calendário mensal */}
        <MonthlyCalendar
          sessions={(sessionsRaw ?? []) as { id: string; type: string; duration_min: number; trained_at: string }[]}
          beltId={profile.belt_id}
          publicMode />


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

        {/* Sprint P1.5 — Timeline de evolução */}
        <div className="bg-brand-surface rounded-2xl p-4 border border-brand-elev">
          <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary mb-3">Jornada</p>
          <ProfileTimeline userId={profile.id} />
        </div>

        {/* Sprint P1.8 — Posts (fotos) */}
        <ProfilePosts userId={profile.id} />

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
