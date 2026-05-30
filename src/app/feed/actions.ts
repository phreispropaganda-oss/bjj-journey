'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type OssKind = 'oss' | 'super_oss'

// PRD §4.1 — Oss simples (tap) e Super Oss! (double-tap)
export async function toggleOss(sessionId: string, kind: OssKind = 'oss') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  type ExistingKudos = { user_id: string; kind: OssKind }
  const { data: existingRaw } = await supabase
    .from('kudos').select('user_id, kind')
    .eq('session_id', sessionId).eq('user_id', user.id).maybeSingle()
  const existing = existingRaw as ExistingKudos | null

  // Lógica:
  // - sem kudos + kind 'oss'        → insere oss
  // - sem kudos + kind 'super_oss'  → insere super_oss
  // - tem oss  + kind 'oss'         → remove (toggle off)
  // - tem oss  + kind 'super_oss'   → upgrade para super_oss
  // - tem super_oss + qualquer kind → remove

  if (!existing) {
    const { error } = await (supabase.from('kudos') as ReturnType<typeof supabase.from>).insert({
      session_id: sessionId, user_id: user.id, kind,
    } as never)
    if (error) {
      if (error.message.includes('Limite diário')) {
        return { error: 'Você atingiu o limite de 100 Oss! por dia.' }
      }
      return { error: error.message }
    }
  } else if (existing.kind === 'oss' && kind === 'super_oss') {
    // Upgrade
    const { error } = await (supabase.from('kudos') as ReturnType<typeof supabase.from>)
      .update({ kind: 'super_oss' } as never)
      .match({ session_id: sessionId, user_id: user.id } as never)
    if (error) return { error: error.message }
  } else {
    // Remove
    const { error } = await supabase.from('kudos' as never)
      .delete().match({ session_id: sessionId, user_id: user.id } as never)
    if (error) return { error: error.message }
  }

  revalidatePath('/feed')
  return { ok: true }
}

export async function postComment(sessionId: string, text: string, replyTo?: string | null) {
  const clean = text.trim()
  if (!clean) return { error: 'empty' }
  if (clean.length > 500) return { error: 'too_long' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  type CommentInsert = {
    session_id: string
    user_id: string
    text: string
    reply_to: string | null
  }
  const payload: CommentInsert = {
    session_id: sessionId,
    user_id: user.id,
    text: clean,
    reply_to: replyTo ?? null,
  }

  const { error, data } = await (supabase.from('comments') as ReturnType<typeof supabase.from>)
    .insert(payload as never)
    .select('id')
    .single()

  if (error) {
    if (error.message.includes('Limite diário')) {
      return { error: 'Você atingiu o limite de 50 comentários por dia.' }
    }
    return { error: error.message }
  }
  revalidatePath('/feed')
  return { ok: true, id: (data as { id: string } | null)?.id }
}

// PRD §4.2 — Apagar próprio comentário
export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: c } = await supabase
    .from('comments').select('user_id').eq('id', commentId).single()
  const com = c as { user_id: string } | null
  if (!com) return { error: 'not_found' }
  if (com.user_id !== user.id) return { error: 'not_owner' }

  const { error } = await supabase.from('comments' as never).delete().eq('id', commentId)
  if (error) return { error: error.message }
  revalidatePath('/feed')
  return { ok: true }
}

export async function toggleFollow(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  if (targetUserId === user.id) return { error: 'cannot_follow_self' }

  const { data: existing } = await supabase.from('follows')
    .select('follower_id')
    .eq('follower_id', user.id).eq('following_id', targetUserId).maybeSingle()

  if (existing) {
    await supabase.from('follows' as never)
      .delete().match({ follower_id: user.id, following_id: targetUserId } as never)
    return { ok: true, following: false }
  } else {
    await (supabase.from('follows') as ReturnType<typeof supabase.from>).insert({
      follower_id: user.id, following_id: targetUserId,
    } as never)
    return { ok: true, following: true }
  }
}
