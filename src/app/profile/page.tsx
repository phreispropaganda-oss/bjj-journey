import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProfileRedirect() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('username').eq('id', user.id).maybeSingle()
  const username = (profile as { username: string } | null)?.username
  if (!username) redirect('/onboarding')
  redirect(`/profile/${username}`)
}
