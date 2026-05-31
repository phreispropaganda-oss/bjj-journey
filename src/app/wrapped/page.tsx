import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WrappedClient from '@/components/wrapped/WrappedClient'

interface Stats {
  total_sessions: number
  total_minutes: number
  total_calories: number
  total_subs_for: number
  total_subs_against: number
  total_rolls: number
  longest_streak: number
  longest_session: number
  busiest_month: number
  busiest_month_min: number
  top_modality: string
  top_modality_min: number
  top_techniques: { tag: string; count: number }[]
  level_end: number
  first_session_at: string | null
  last_session_at: string | null
}

export default async function WrappedPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const year = Number(sp.year) || new Date().getFullYear()

  type ProfLite = { name: string; username: string; belt_id: string; avatar_url: string | null; degrees: number }
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('name, username, belt_id, avatar_url, degrees')
    .eq('id', user.id).maybeSingle()
  const profile = profileRaw as ProfLite | null

  const { data: statsRaw } = await (supabase as unknown as {
    rpc: (n: string, p: Record<string, unknown>) => Promise<{ data: Stats[] | null }>
  }).rpc('wrapped_stats', { p_year: year })

  const stats = (statsRaw ?? [])[0] ?? {
    total_sessions: 0, total_minutes: 0, total_calories: 0,
    total_subs_for: 0, total_subs_against: 0, total_rolls: 0,
    longest_streak: 0, longest_session: 0,
    busiest_month: 0, busiest_month_min: 0,
    top_modality: 'bjj', top_modality_min: 0,
    top_techniques: [], level_end: 1,
    first_session_at: null, last_session_at: null,
  }

  if (stats.total_sessions === 0) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-6xl mb-4">🥋</p>
          <h1 className="font-display text-2xl text-ink-primary mb-2">Belt Rise Wrapped {year}</h1>
          <p className="text-ink-secondary text-sm mb-6">Sem treinos registrados em {year}. Treine para gerar sua retrospectiva.</p>
          <a href="/treino/novo" className="btn-primary inline-block">Registrar treino</a>
        </div>
      </div>
    )
  }

  return (
    <WrappedClient
      year={year}
      stats={stats}
      profile={{
        name:     profile?.name ?? 'Atleta',
        username: profile?.username ?? user.id.slice(0, 8),
        beltId:   profile?.belt_id ?? 'white',
        avatarUrl: profile?.avatar_url ?? null,
        degrees:  profile?.degrees ?? 0,
      }}
    />
  )
}
