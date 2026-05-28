import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as Profile | null

  if (!profile?.name) redirect('/onboarding')

  const { data: attendance } = await supabase
    .from('attendance')
    .select('date')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(60)

  const { data: completions } = await supabase
    .from('technique_completions')
    .select('belt_id, module_id, technique_name')
    .eq('user_id', user.id)

  return (
    <DashboardClient
      profile={profile!}
      attendance={(attendance ?? []) as { date: string }[]}
      completions={(completions ?? []) as { belt_id: string; module_id: string; technique_name: string }[]}
    />
  )
}
