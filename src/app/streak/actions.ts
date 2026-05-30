'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isPro } from '@/lib/stripe/access'

/** Aluno Pro: pode usar 1 shield por mes para nao quebrar o streak */
export async function useStreakShield() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const pro = await isPro(user.id)
  if (!pro) return { error: 'pro_required' }

  const { data: pRaw } = await supabase.from('profiles')
    .select('shield_used_month, streak').eq('id', user.id).maybeSingle()
  const p = pRaw as { shield_used_month: number; streak: number } | null
  if (!p) return { error: 'not_found' }
  if (p.shield_used_month >= 1) return { error: 'already_used_this_month' }

  // Marca shield usado E incrementa streak para preservar
  const { error } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
    .update({ shield_used_month: 1, streak: p.streak + 1 } as never)
    .eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  return { ok: true }
}
