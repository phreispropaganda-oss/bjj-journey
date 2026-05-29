'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleOss(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: existing } = await supabase
    .from('kudos').select('user_id')
    .eq('session_id', sessionId).eq('user_id', user.id).maybeSingle()

  if (existing) {
    await supabase.from('kudos' as never)
      .delete().match({ session_id: sessionId, user_id: user.id } as never)
  } else {
    await (supabase.from('kudos') as ReturnType<typeof supabase.from>).insert({
      session_id: sessionId, user_id: user.id,
    } as never)
  }

  revalidatePath('/feed')
  return { ok: true }
}

export async function postComment(sessionId: string, text: string) {
  const clean = text.trim()
  if (!clean) return { error: 'empty' }
  if (clean.length > 500) return { error: 'too_long' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await (supabase.from('comments') as ReturnType<typeof supabase.from>).insert({
    session_id: sessionId, user_id: user.id, text: clean,
  } as never)

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
