import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import UsuariosClient from '@/components/owner/UsuariosClient'

const BELT_COLOR: Record<string, string> = {
  white:'#E8E8E8', blue:'#2563EB', purple:'#7C3AED', brown:'#92400E', black:'#1A1A1A',
}

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminCheck } = await supabase
    .from('admin_users').select('user_id').eq('user_id', user.id).single()
  if (!adminCheck) redirect('/dashboard')

  const { data: profilesRaw } = await supabase
    .from('profiles').select('*').order('created_at', { ascending: false })
  const profiles = (profilesRaw ?? []) as {
    id: string; name: string; username: string; belt_id: string; degrees: number;
    xp: number; streak: number; academy_name: string | null;
    is_public: boolean; active: boolean; deleted_at: string | null;
    created_at: string;
  }[]

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-[#1A1A1A] border-b border-[#333] px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/owner" className="text-ink-secondary text-sm">← Owner</Link>
        <h1 className="text-white font-black text-base flex-1">Usuários</h1>
        <span className="bg-[#2A2A2A] text-ink-muted text-xs px-2 py-0.5 rounded-full font-bold">
          {profiles.length}
        </span>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto pb-10">
        <UsuariosClient
          profiles={profiles}
          beltColor={BELT_COLOR}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
