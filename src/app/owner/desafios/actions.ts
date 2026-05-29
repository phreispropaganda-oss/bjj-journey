'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface NewChallenge {
  title: string
  description: string
  emoji: string
  metric: string
  target: number
  scope: 'global' | 'academy'
  academy_id: string | null
  starts_at: string
  ends_at: string
}

const ALLOWED_METRICS = ['training_count','training_minutes','submissions','streak_days','technique_count']

export async function createChallenge(input: NewChallenge) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  // Validate authority
  const [{ data: isOwner }, { data: academyAdmin }] = await Promise.all([
    supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle(),
    input.scope === 'academy' && input.academy_id
      ? supabase.from('academy_members').select('role')
          .eq('user_id', user.id).eq('academy_id', input.academy_id).eq('role', 'admin').maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (input.scope === 'global' && !isOwner) {
    return { error: 'Apenas o owner pode criar desafios globais' }
  }
  if (input.scope === 'academy' && !isOwner && !academyAdmin) {
    return { error: 'Você precisa ser admin desta academia' }
  }

  // Validate payload
  if (!input.title?.trim()) return { error: 'Título obrigatório' }
  if (input.title.length > 100) return { error: 'Título muito longo (max 100)' }
  if (input.target < 1 || input.target > 100000) return { error: 'Meta inválida (1 a 100.000)' }
  if (!ALLOWED_METRICS.includes(input.metric)) return { error: 'Métrica inválida' }
  if (input.scope === 'academy' && !input.academy_id) return { error: 'Academia não selecionada' }
  if (new Date(input.ends_at) <= new Date(input.starts_at)) {
    return { error: 'Data fim deve ser depois do início' }
  }

  const payload = {
    title:       input.title.trim(),
    description: (input.description || input.title).trim(),
    emoji:       input.emoji || '🥋',
    metric:      input.metric,
    target:      input.target,
    scope:       input.scope,
    academy_id:  input.scope === 'academy' ? input.academy_id : null,
    starts_at:   input.starts_at,
    ends_at:     input.ends_at,
    active:      true,
    created_by:  user.id,
  }

  const { error, data } = await (supabase.from('challenges') as ReturnType<typeof supabase.from>)
    .insert(payload as never)
    .select('id').single()

  if (error) return { error: error.message }
  if (!data) return { error: 'Falha ao criar desafio' }

  revalidatePath('/desafios')
  revalidatePath('/owner/desafios')
  return { ok: true, id: (data as { id: string }).id }
}

export async function toggleChallengeActive(id: string, active: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: isOwner } = await supabase.from('admin_users')
    .select('user_id').eq('user_id', user.id).maybeSingle()

  const { data: ch } = await supabase.from('challenges')
    .select('academy_id, scope, created_by').eq('id', id).single()
  const challenge = ch as { academy_id: string | null; scope: string; created_by: string } | null
  if (!challenge) return { error: 'Desafio não encontrado' }

  let allowed = !!isOwner || challenge.created_by === user.id
  if (!allowed && challenge.academy_id) {
    const { data: admin } = await supabase.from('academy_members')
      .select('role').eq('user_id', user.id)
      .eq('academy_id', challenge.academy_id).eq('role', 'admin').maybeSingle()
    allowed = !!admin
  }
  if (!allowed) return { error: 'Sem permissão' }

  await (supabase.from('challenges') as ReturnType<typeof supabase.from>)
    .update({ active } as never).eq('id', id)

  revalidatePath('/desafios')
  revalidatePath('/owner/desafios')
  return { ok: true }
}

export async function deleteChallenge(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: isOwner } = await supabase.from('admin_users')
    .select('user_id').eq('user_id', user.id).maybeSingle()

  const { data: ch } = await supabase.from('challenges')
    .select('academy_id, created_by').eq('id', id).single()
  const challenge = ch as { academy_id: string | null; created_by: string } | null
  if (!challenge) return { error: 'Desafio não encontrado' }

  let allowed = !!isOwner || challenge.created_by === user.id
  if (!allowed && challenge.academy_id) {
    const { data: admin } = await supabase.from('academy_members')
      .select('role').eq('user_id', user.id)
      .eq('academy_id', challenge.academy_id).eq('role', 'admin').maybeSingle()
    allowed = !!admin
  }
  if (!allowed) return { error: 'Sem permissão' }

  await supabase.from('challenges' as never).delete().eq('id', id)
  revalidatePath('/desafios')
  revalidatePath('/owner/desafios')
  return { ok: true }
}
