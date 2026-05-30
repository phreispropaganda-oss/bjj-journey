'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type VerifStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

interface RequestPayload {
  beltId:        string
  degrees:       number
  modality?:     'bjj' | 'muay_thai' | 'boxe' | 'judo'
  instructorName?: string
  academyId?:    string | null
  graduatedAt?:  string  // yyyy-mm-dd
  notes?:        string
  proofPath?:    string  // path in belt-proofs bucket
  proofKind?:    'photo' | 'video' | 'document' | 'other'
}

export async function requestBeltVerification(p: RequestPayload) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const payload = {
    user_id:         user.id,
    belt_id:         p.beltId,
    degrees:         Math.max(0, Math.min(6, p.degrees || 0)),
    modality:        p.modality ?? 'bjj',
    proof_url:       p.proofPath ?? null,
    proof_kind:      p.proofKind ?? 'photo',
    instructor_name: p.instructorName?.trim() || null,
    academy_id:      p.academyId ?? null,
    graduated_at:    p.graduatedAt || null,
    notes:           p.notes?.trim() || null,
    status:          'pending' as const,
  }

  const { data, error } = await (supabase.from('belt_verifications') as ReturnType<typeof supabase.from>)
    .insert(payload as never).select('id').single()

  if (error) return { error: error.message }

  revalidatePath('/graduacao')
  revalidatePath('/profile')
  return { ok: true, id: (data as { id: string } | null)?.id }
}

export async function reviewBeltVerification(
  id: string,
  status: 'verified' | 'rejected',
  note?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await (supabase.from('belt_verifications') as ReturnType<typeof supabase.from>)
    .update({
      status,
      reviewer_note: note?.trim() || null,
      reviewed_by:   user.id,
      reviewed_at:   new Date().toISOString(),
    } as never)
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/graduacao/revisar')
  revalidatePath('/academia')
  return { ok: true }
}

// Signed URL pra exibir o proof (privado)
export async function getProofSignedUrl(path: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from('belt-proofs').createSignedUrl(path, 600)
  if (error) return { error: error.message }
  return { ok: true, url: data.signedUrl }
}
