import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface AuditRow {
  id: string; actor_id: string | null; action: string;
  target_id: string | null; target_kind: string | null;
  metadata: Record<string, unknown>; created_at: string;
  actor_name: string | null;
}

const ACTION_EMOJI: Record<string, string> = {
  'belt.verified':       '✅',
  'belt.rejected':       '❌',
  'shadow_ban.manual':   '🚫',
  'shadow_ban.removed':  '↩️',
  'report.approved':     '⚠️',
  'report.dismissed':    '🟢',
}

export default async function AuditoriaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminCheck } = await supabase
    .from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!adminCheck) redirect('/dashboard')

  const { data: rowsRaw } = await (supabase as unknown as {
    rpc: (n: string, p: Record<string, number>) => Promise<{ data: AuditRow[] | null }>
  }).rpc('audit_recent', { p_limit: 200 })
  const rows = (rowsRaw ?? []) as AuditRow[]

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/owner" className="text-ink-muted text-sm">← Owner</Link>
        <h1 className="font-display text-base text-ink-primary flex-1">Auditoria</h1>
        <span className="text-xs text-ink-muted">{rows.length} eventos</span>
      </div>

      <div className="px-4 py-4 max-w-3xl mx-auto pb-10 space-y-1.5">
        {rows.length === 0 ? (
          <div className="card-elev text-center py-10">
            <p className="text-4xl mb-2">📋</p>
            <p className="font-display text-ink-primary">Sem eventos</p>
          </div>
        ) : rows.map(r => (
          <div key={r.id} className="card-elev py-2 flex items-center gap-3 text-sm">
            <span className="text-lg">{ACTION_EMOJI[r.action] ?? '•'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-ink-primary font-bold truncate">{r.action}</p>
              <p className="text-[10px] text-ink-muted">
                {r.actor_name ?? r.actor_id?.slice(0,8) ?? 'system'}
                {r.target_kind && r.target_id && ` → ${r.target_kind} ${r.target_id.slice(0,8)}`}
              </p>
            </div>
            <span className="text-[10px] text-ink-muted whitespace-nowrap">
              {new Date(r.created_at).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
