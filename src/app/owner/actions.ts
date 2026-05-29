'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function assertOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, supabase: null, userId: null, error: 'not_logged_in' }
  const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!data) return { ok: false as const, supabase: null, userId: null, error: 'not_owner' }
  return { ok: true as const, supabase, userId: user.id }
}

export async function setUserActive(userId: string, active: boolean) {
  const ctx = await assertOwner()
  if (!ctx.ok) return { error: ctx.error }
  if (userId === ctx.userId) return { error: 'cannot_self_deactivate' }

  const { error, data } = await (ctx.supabase.from('profiles') as ReturnType<typeof ctx.supabase.from>)
    .update({ active } as never)
    .eq('id', userId)
    .select('id')

  if (error)               return { error: `db_error: ${error.message}` }
  if (!data || data.length === 0) return { error: 'no_row_affected' }

  revalidatePath('/owner')
  revalidatePath('/owner/usuarios')
  return { ok: true }
}

export async function softDeleteUser(userId: string) {
  const ctx = await assertOwner()
  if (!ctx.ok) return { error: ctx.error }
  if (userId === ctx.userId) return { error: 'cannot_self_delete' }

  const { error, data } = await (ctx.supabase.from('profiles') as ReturnType<typeof ctx.supabase.from>)
    .update({
      active: false,
      deleted_at: new Date().toISOString(),
      is_public: false,
    } as never)
    .eq('id', userId)
    .select('id')

  if (error)               return { error: `db_error: ${error.message}` }
  if (!data || data.length === 0) return { error: 'no_row_affected' }

  revalidatePath('/owner')
  revalidatePath('/owner/usuarios')
  return { ok: true }
}

export async function restoreUser(userId: string) {
  const ctx = await assertOwner()
  if (!ctx.ok) return { error: ctx.error }

  const { error, data } = await (ctx.supabase.from('profiles') as ReturnType<typeof ctx.supabase.from>)
    .update({ active: true, deleted_at: null } as never)
    .eq('id', userId)
    .select('id')

  if (error)               return { error: `db_error: ${error.message}` }
  if (!data || data.length === 0) return { error: 'no_row_affected' }

  revalidatePath('/owner')
  revalidatePath('/owner/usuarios')
  return { ok: true }
}
