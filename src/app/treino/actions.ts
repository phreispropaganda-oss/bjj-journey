'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type Visibility = 'public' | 'followers' | 'private'

export async function updateSessionVisibility(sessionId: string, visibility: Visibility) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: session } = await supabase
    .from('training_sessions').select('user_id').eq('id', sessionId).single()
  const s = session as { user_id: string } | null
  if (!s) return { error: 'not_found' }
  if (s.user_id !== user.id) return { error: 'not_owner' }

  const { error } = await (supabase.from('training_sessions') as ReturnType<typeof supabase.from>)
    .update({ visibility } as never).eq('id', sessionId)

  if (error) return { error: error.message }
  revalidatePath('/feed')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function deleteTrainingSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  // Verify ownership
  const { data: session } = await supabase
    .from('training_sessions').select('user_id, photo_url').eq('id', sessionId).single()
  const s = session as { user_id: string; photo_url: string | null } | null
  if (!s) return { error: 'not_found' }
  if (s.user_id !== user.id) return { error: 'not_owner' }

  // Delete photo from storage if exists
  if (s.photo_url) {
    const match = s.photo_url.match(/\/training-photos\/(.+?)(\?|$)/)
    if (match?.[1]) {
      await supabase.storage.from('training-photos').remove([match[1]])
    }
  }

  // Delete session (cascades to kudos/comments)
  const { error } = await supabase.from('training_sessions' as never).delete().eq('id', sessionId)
  if (error) return { error: error.message }

  revalidatePath('/feed')
  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  return { ok: true }
}
