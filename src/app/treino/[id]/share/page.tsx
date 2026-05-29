import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShareSession from '@/components/treino/ShareSession'

interface Props { params: Promise<{ id: string }> }

interface Session {
  id: string; user_id: string; type: string; duration_min: number;
  trained_at: string; instructor: string | null; techniques: string[];
  rolls: number; subs_for: number; subs_against: number;
  feeling: number | null; note: string | null; photo_url: string | null;
}
interface Profile {
  id: string; name: string; username: string; belt_id: string; degrees: number;
  academy_name: string | null; xp: number; streak: number; avatar_url: string | null;
}

export default async function ShareTrainingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessionRaw } = await supabase
    .from('training_sessions').select('*').eq('id', id).single()
  if (!sessionRaw) notFound()
  const session = sessionRaw as Session

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('id, name, username, belt_id, degrees, academy_name, xp, streak, avatar_url')
    .eq('id', session.user_id).single()
  if (!profileRaw) notFound()
  const profile = profileRaw as unknown as Profile

  const { data: caloriesRaw } = await (supabase as unknown as {
    rpc: (n: string, p: Record<string, string | number>) => Promise<{ data: number | null }>
  }).rpc('calories_for_session', { p_user_id: session.user_id, p_duration_min: session.duration_min })
  const calories = (caloriesRaw as unknown as number) ?? 0

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bjj-journey-iota.vercel.app'
  const profileUrl = `${appUrl}/profile/${profile.username}`

  return (
    <ShareSession session={session} profile={profile} calories={calories} profileUrl={profileUrl} />
  )
}
