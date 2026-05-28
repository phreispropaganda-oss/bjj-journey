import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProfileRedirectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single()
  const profile = data as { username: string } | null
  redirect(profile?.username ? `/profile/${profile.username}` : '/dashboard')
}
