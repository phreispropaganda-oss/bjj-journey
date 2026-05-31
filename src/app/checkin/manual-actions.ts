'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/** Cadastrar academia manualmente quando a busca nao retorna nada */
export async function createAcademyQuick(payload: {
  name: string
  city?: string
  state_uf?: string
  modality?: 'bjj' | 'muay_thai' | 'boxe' | 'judo'
  latitude?: number
  longitude?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  if (!payload.name?.trim()) return { error: 'name_required' }

  const insertPayload = {
    name:        payload.name.trim().slice(0, 120),
    city:        payload.city?.trim().slice(0, 80) ?? null,
    state_uf:    payload.state_uf?.trim().toUpperCase().slice(0, 2) ?? null,
    modality:    payload.modality ?? 'bjj',
    latitude:    payload.latitude ?? null,
    longitude:   payload.longitude ?? null,
    radius_meters: 80,
    active:      true,
    created_by:  user.id,
  }
  const { data, error } = await (supabase.from('academies') as ReturnType<typeof supabase.from>)
    .insert(insertPayload as never).select('id').single()

  if (error) return { error: error.message }

  // Adiciona criador como owner
  await (supabase.from('academy_members') as ReturnType<typeof supabase.from>)
    .insert({
      user_id:    user.id,
      academy_id: (data as { id: string }).id,
      role:       'owner',
      active:     true,
    } as never)

  revalidatePath('/checkin')
  return { ok: true, id: (data as { id: string }).id }
}
