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

  const [
    { data: achievements },
    { data: attendance },
    { data: adminCheck },
    { data: memberCheck },
    { data: academiesRaw },
  ] = await Promise.all([
    supabase.from('achievements').select('badge_id, unlocked_at').eq('user_id', user.id),
    supabase.from('attendance').select('date').eq('user_id', user.id),
    // Owner check
    supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle(),
    // Academy admin check
    supabase.from('academy_members')
      .select('academy_id, role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'instructor'])
      .maybeSingle(),
    // All academies for the dropdown
    supabase.from('academies').select('id, name').eq('active', true).order('name'),
  ])

  const isOwner        = !!adminCheck
  const isAcademyAdmin = !!(memberCheck as { academy_id: string; role: string } | null)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bjj-journey-iota.vercel.app'

  return (
    <ProfileClient
      profile={profile}
      achievements={(achievements ?? []) as { badge_id: string; unlocked_at: string }[]}
      attendanceCount={(attendance ?? []).length}
      appUrl={appUrl}
      isOwner={isOwner}
      isAcademyAdmin={isAcademyAdmin}
      academies={(academiesRaw ?? []) as { id: string; name: string }[]}
    />
  )
}
