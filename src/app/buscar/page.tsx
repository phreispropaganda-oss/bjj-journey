import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/ui/BottomNav'
import SearchUsersClient from '@/components/search/SearchUsersClient'

export default async function BuscarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('username').eq('id', user.id).maybeSingle()
  const username = (profile as { username: string } | null)?.username

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/dashboard" className="text-ink-muted text-sm min-h-tap flex items-center">←</Link>
        <h1 className="font-display text-base text-ink-primary flex-1">Buscar</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
        <SearchUsersClient />
      </div>

      <BottomNav active="feed" username={username} />
    </div>
  )
}
