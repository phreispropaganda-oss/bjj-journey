'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function assertAdmin(academyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, supabase: null, userId: null }
  const { data: mem } = await supabase
    .from('academy_members').select('role').eq('academy_id', academyId).eq('user_id', user.id).maybeSingle()
  const role = (mem as { role: string } | null)?.role
  const { data: platAdmin } = await supabase
    .from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!platAdmin && !['owner', 'coach'].includes(role ?? '')) return { ok: false as const, supabase: null, userId: null }
  return { ok: true as const, supabase, userId: user.id }
}

export type AcademyUpdate = Partial<{
  name: string
  description: string
  schedule: string
  address: string
  city: string
  state_uf: string
  logo_url: string
  website: string
}>

export async function updateAcademy(academyId: string, patch: AcademyUpdate) {
  const ctx = await assertAdmin(academyId)
  if (!ctx.ok) return { error: 'forbidden' }

  // Sanitize
  const allowed: AcademyUpdate = {}
  if (typeof patch.name        === 'string') allowed.name        = patch.name.trim().slice(0, 120)
  if (typeof patch.description === 'string') allowed.description = patch.description.trim().slice(0, 1000)
  if (typeof patch.schedule    === 'string') allowed.schedule    = patch.schedule.trim().slice(0, 1000)
  if (typeof patch.address     === 'string') allowed.address     = patch.address.trim().slice(0, 200)
  if (typeof patch.city        === 'string') allowed.city        = patch.city.trim().slice(0, 80)
  if (typeof patch.state_uf    === 'string') allowed.state_uf    = patch.state_uf.trim().slice(0, 5)
  if (typeof patch.logo_url    === 'string') allowed.logo_url    = patch.logo_url.trim()
  if (typeof patch.website     === 'string') allowed.website     = patch.website.trim()

  const { error } = await (ctx.supabase.from('academies') as ReturnType<typeof ctx.supabase.from>)
    .update(allowed as never).eq('id', academyId)
  if (error) return { error: error.message }

  revalidatePath(`/academy/${academyId}`)
  revalidatePath(`/academy/${academyId}/admin`)
  return { ok: true }
}
