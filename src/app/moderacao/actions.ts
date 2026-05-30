'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ReportKind   = 'session' | 'comment' | 'profile' | 'academy'
export type ReportReason = 'spam' | 'harassment' | 'hate' | 'nudity' |
                            'violence' | 'impersonation' | 'misinformation' |
                            'illegal' | 'other'
export type ReportStatus = 'pending' | 'approved' | 'dismissed'

// PRD §5.5 — Reportar conteúdo
export async function reportContent(
  targetId: string,
  targetKind: ReportKind,
  reason: ReportReason,
  description?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  type Payload = {
    reporter_id: string
    target_id: string
    target_kind: ReportKind
    reason: ReportReason
    description: string | null
  }
  const payload: Payload = {
    reporter_id: user.id,
    target_id:   targetId,
    target_kind: targetKind,
    reason,
    description: description?.trim() || null,
  }

  const { error } = await (supabase.from('reports') as ReturnType<typeof supabase.from>)
    .insert(payload as never)

  if (error) {
    if (error.message.includes('Limite diário')) {
      return { error: 'Você atingiu o limite de 10 denúncias por dia.' }
    }
    if (error.message.includes('reports_no_self')) {
      return { error: 'Você não pode reportar o próprio conteúdo.' }
    }
    if (error.message.includes('duplicate key')) {
      return { error: 'Você já reportou este conteúdo.' }
    }
    return { error: error.message }
  }
  return { ok: true }
}

// ── Admin actions ──

async function assertOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, supabase: null, userId: null }
  const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!data) return { ok: false as const, supabase: null, userId: null }
  return { ok: true as const, supabase, userId: user.id }
}

export async function resolveReport(
  reportId: string,
  status: 'approved' | 'dismissed',
  note?: string
) {
  const ctx = await assertOwner()
  if (!ctx.ok) return { error: 'unauthorized' }

  const { error } = await (ctx.supabase.from('reports') as ReturnType<typeof ctx.supabase.from>)
    .update({
      status,
      resolved_by: ctx.userId,
      resolved_at: new Date().toISOString(),
      resolution_note: note?.trim() || null,
    } as never)
    .eq('id', reportId)

  if (error) return { error: error.message }

  revalidatePath('/owner/moderacao')
  return { ok: true }
}

export async function setShadowBan(userId: string, banned: boolean) {
  const ctx = await assertOwner()
  if (!ctx.ok) return { error: 'unauthorized' }
  if (userId === ctx.userId) return { error: 'cannot_self_ban' }

  const { error } = await (ctx.supabase.from('profiles') as ReturnType<typeof ctx.supabase.from>)
    .update({
      shadow_banned:    banned,
      shadow_banned_at: banned ? new Date().toISOString() : null,
    } as never)
    .eq('id', userId)

  if (error) return { error: error.message }

  // Audit
  await (ctx.supabase as unknown as { rpc: (n: string, p: Record<string, unknown>) => Promise<unknown> })
    .rpc('log_action', {
      p_action:      banned ? 'shadow_ban.manual' : 'shadow_ban.removed',
      p_target_id:   userId,
      p_target_kind: 'profile',
      p_metadata:    {},
    })

  revalidatePath('/owner/moderacao')
  revalidatePath('/owner/usuarios')
  return { ok: true }
}
