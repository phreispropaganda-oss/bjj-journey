import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from '@/components/profile/ProfileClient'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profileRaw) redirect('/onboarding')

  const profile = profileRaw as Profile

  const [{ data: achievements }, { data: attendance }] = await Promise.all([
    supabase.from('achievements').select('badge_id, unlocked_at').eq('user_id', user.id),
    supabase.from('attendance').select('date').eq('user_id', user.id),
  ])

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bjj-journey-iota.vercel.app'

  return (
    <ProfileClient
      profile={profile}
      achievements={(achievements ?? []) as { badge_id: string; unlocked_at: string }[]}
      attendanceCount={(attendance ?? []).length}
      appUrl={appUrl}
    />
  )
}
