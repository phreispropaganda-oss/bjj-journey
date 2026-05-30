'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type Source = 'gps' | 'qr' | 'manual'

interface Nearby { id: string; name: string; distance_m: number; radius_meters: number; inside: boolean }

export async function findNearby(lat: number, lng: number, radiusM = 2000): Promise<Nearby[]> {
  const supabase = await createClient()
  const { data } = await (supabase as unknown as {
    rpc: (n: string, p: Record<string, number>) => Promise<{ data: Nearby[] | null }>
  }).rpc('nearby_academies', { p_lat: lat, p_lng: lng, p_search_radius_m: radiusM })
  return data ?? []
}

export async function startVisit(academyId: string, source: Source, lat?: number, lng?: number) {
  const supabase = await createClient()
  const { data, error } = await (supabase as unknown as {
    rpc: (n: string, p: Record<string, unknown>) => Promise<{ data: string | null; error: { message: string } | null }>
  }).rpc('start_visit', {
    p_academy_id: academyId,
    p_source:     source,
    p_lat:        lat ?? null,
    p_lng:        lng ?? null,
  })
  if (error) return { error: error.message }
  revalidatePath('/checkin')
  return { ok: true, id: data }
}

export async function endVisit(visitId: string) {
  const supabase = await createClient()
  const { data, error } = await (supabase as unknown as {
    rpc: (n: string, p: Record<string, string>) => Promise<{ data: number | null; error: { message: string } | null }>
  }).rpc('end_visit', { p_visit_id: visitId })
  if (error) return { error: error.message }
  revalidatePath('/checkin')
  return { ok: true, minutes: data ?? 0 }
}

export async function convertVisit(visitId: string, type = 'gi', note?: string) {
  const supabase = await createClient()
  const { data, error } = await (supabase as unknown as {
    rpc: (n: string, p: Record<string, string>) => Promise<{ data: string | null; error: { message: string } | null }>
  }).rpc('convert_visit_to_session', { p_visit_id: visitId, p_type: type, p_note: note ?? '' })
  if (error) return { error: error.message }
  revalidatePath('/checkin'); revalidatePath('/feed')
  return { ok: true, sessionId: data }
}

export async function findAcademyByQrToken(token: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('academies').select('id, name, latitude, longitude, radius_meters')
    .eq('qr_token', token).eq('active', true).maybeSingle()
  return data as { id: string; name: string; latitude: number | null; longitude: number | null; radius_meters: number } | null
}
