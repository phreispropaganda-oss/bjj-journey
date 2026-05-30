import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AcademyAdminClient from '@/components/academy/AcademyAdminClient'

interface Academy {
  id: string; name: string; logo_url: string | null;
  city: string | null; state_uf: string | null;
  address: string | null; description: string | null;
  schedule: string | null; website: string | null;
}
interface Member { user_id: string; role: string; joined_at: string; active: boolean }
interface ProfileLite { id: string; name: string; username: string; avatar_url: string | null; belt_id: string; degrees: number; xp: number; streak: number }

export default async function AcademyAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Authorization gate (403 for non-owner/coach)
  const { data: mem } = await supabase
    .from('academy_members')
    .select('role').eq('academy_id', id).eq('user_id', user.id).maybeSingle()
  const role = (mem as { role: string } | null)?.role
  const { data: isPlatformAdmin } = await supabase
    .from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!isPlatformAdmin && !['owner', 'coach'].includes(role ?? '')) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-5xl mb-3">🔒</p>
          <p className="font-display text-ink-primary mb-1">403 — Sem permissão</p>
          <p className="text-sm text-ink-secondary mb-4">Apenas owners e coaches editam esta academia.</p>
          <Link href={`/academy/${id}`} className="text-blood text-sm font-bold">Ver página pública</Link>
        </div>
      </div>
    )
  }

  const { data: acRaw } = await supabase
    .from('academies')
    .select('id, name, logo_url, city, state_uf, address, description, schedule, website')
    .eq('id', id).maybeSingle()
  const academy = acRaw as Academy | null
  if (!academy) notFound()

  // Membros
  const { data: memsRaw } = await supabase
    .from('academy_members').select('user_id, role, joined_at, active').eq('academy_id', id)
  const memberRows = (memsRaw ?? []) as Member[]
  const userIds = memberRows.map(m => m.user_id)
  const { data: profsRaw } = userIds.length > 0
    ? await supabase.from('profiles').select('id, name, username, avatar_url, belt_id, degrees, xp, streak').in('id', userIds)
    : { data: [] }
  const profsMap = new Map<string, ProfileLite>()
  ;((profsRaw ?? []) as ProfileLite[]).forEach(p => profsMap.set(p.id, p))

  // Ultimo treino por aluno
  const { data: lastRaw } = userIds.length > 0
    ? await supabase.from('training_sessions')
        .select('user_id, trained_at')
        .in('user_id', userIds)
        .order('trained_at', { ascending: false })
        .limit(500)
    : { data: [] }
  const lastByUser = new Map<string, string>()
  for (const r of ((lastRaw ?? []) as { user_id: string; trained_at: string }[])) {
    if (!lastByUser.has(r.user_id)) lastByUser.set(r.user_id, r.trained_at)
  }

  const members = memberRows.map(m => {
    const p = profsMap.get(m.user_id)
    return {
      user_id: m.user_id, role: m.role, active: m.active,
      joined_at: m.joined_at,
      name: p?.name ?? 'Usuário', username: p?.username ?? m.user_id.slice(0, 8),
      avatar_url: p?.avatar_url ?? null,
      belt_id: p?.belt_id ?? 'white', degrees: p?.degrees ?? 0,
      xp: p?.xp ?? 0, streak: p?.streak ?? 0,
      last_session_at: lastByUser.get(m.user_id) ?? null,
    }
  })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/academy/${id}`} className="text-ink-muted text-sm">← Pública</Link>
        <h1 className="font-display text-base text-ink-primary flex-1 truncate">Admin · {academy.name}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-10">
        <AcademyAdminClient academy={academy} members={members} />
      </div>
    </div>
  )
}
