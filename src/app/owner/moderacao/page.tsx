import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ModeracaoClient from '@/components/owner/ModeracaoClient'

interface ReportRow {
  id: string
  reporter_id: string
  target_id: string
  target_kind: 'session' | 'comment' | 'profile' | 'academy'
  target_user_id: string | null
  reason: string
  description: string | null
  status: 'pending' | 'approved' | 'dismissed'
  created_at: string
}
interface ProfileLite {
  id: string; name: string; username: string;
  belt_id: string; avatar_url: string | null;
  shadow_banned: boolean; report_count: number;
}
interface SessionLite { id: string; note: string | null; photo_url: string | null; visibility: string }
interface CommentLite { id: string; text: string; session_id: string }
interface Stats { pending_count: number; approved_30d: number; dismissed_30d: number; shadow_banned_total: number }

export default async function ModeracaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminCheck } = await supabase
    .from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!adminCheck) redirect('/dashboard')

  const { data: reportsRaw } = await supabase
    .from('reports').select('*')
    .order('status', { ascending: true })  // pending primeiro
    .order('created_at', { ascending: false })
    .limit(100)

  const reports = (reportsRaw ?? []) as ReportRow[]

  // Buscar dados denormalizados (reporter, target_user, target_content)
  const userIds = new Set<string>()
  reports.forEach(r => {
    userIds.add(r.reporter_id)
    if (r.target_user_id) userIds.add(r.target_user_id)
  })
  const sessionIds = reports.filter(r => r.target_kind === 'session').map(r => r.target_id)
  const commentIds = reports.filter(r => r.target_kind === 'comment').map(r => r.target_id)

  const [{ data: profsRaw }, { data: sessRaw }, { data: comRaw }, { data: statsRaw }] = await Promise.all([
    userIds.size > 0
      ? supabase.from('profiles').select('id, name, username, belt_id, avatar_url, shadow_banned, report_count').in('id', [...userIds])
      : Promise.resolve({ data: [] }),
    sessionIds.length > 0
      ? supabase.from('training_sessions').select('id, note, photo_url, visibility').in('id', sessionIds)
      : Promise.resolve({ data: [] }),
    commentIds.length > 0
      ? supabase.from('comments').select('id, text, session_id').in('id', commentIds)
      : Promise.resolve({ data: [] }),
    (supabase as unknown as { rpc: (n: string) => Promise<{ data: Stats[] | null }> })
      .rpc('moderation_stats'),
  ])

  const profMap: Record<string, ProfileLite> = {}
  ;((profsRaw ?? []) as ProfileLite[]).forEach(p => { profMap[p.id] = p })
  const sessionMap: Record<string, SessionLite> = {}
  ;((sessRaw ?? []) as SessionLite[]).forEach(s => { sessionMap[s.id] = s })
  const commentMap: Record<string, CommentLite> = {}
  ;((comRaw ?? []) as CommentLite[]).forEach(c => { commentMap[c.id] = c })

  const stats = (statsRaw ?? [])[0] ?? { pending_count: 0, approved_30d: 0, dismissed_30d: 0, shadow_banned_total: 0 }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/owner" className="text-ink-muted text-sm min-h-tap flex items-center">← Owner</Link>
        <h1 className="font-display text-base text-ink-primary flex-1">Moderação</h1>
        {stats.pending_count > 0 && (
          <span className="bg-blood/20 text-blood text-xs font-black px-2.5 py-1 rounded-full">
            {stats.pending_count} pendentes
          </span>
        )}
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto pb-10 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { v: stats.pending_count,        l: 'Pendentes',     color: 'blood' },
            { v: stats.approved_30d,         l: 'Aprov. 30d',    color: 'volt' },
            { v: stats.dismissed_30d,        l: 'Rejeit. 30d',   color: 'ink-secondary' },
            { v: stats.shadow_banned_total,  l: 'Shadow-ban',    color: 'amber-400' },
          ].map(k => (
            <div key={k.l} className="card-elev p-3 text-center">
              <p className={`font-display text-2xl text-${k.color}`}>{k.v}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-ink-muted mt-1">{k.l}</p>
            </div>
          ))}
        </div>

        <ModeracaoClient
          reports={reports}
          profileMap={profMap}
          sessionMap={sessionMap}
          commentMap={commentMap}
        />
      </div>
    </div>
  )
}
