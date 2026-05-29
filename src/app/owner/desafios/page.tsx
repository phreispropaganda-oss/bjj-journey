import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DesafiosManager from '@/components/owner/DesafiosManager'

export default async function OwnerDesafiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminCheck } = await supabase
    .from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()

  const { data: academyMember } = await supabase
    .from('academy_members').select('academy_id, role')
    .eq('user_id', user.id).in('role', ['admin']).maybeSingle()

  const isOwner = !!adminCheck
  const academyAdminId = (academyMember as { academy_id: string; role: string } | null)?.academy_id
  if (!isOwner && !academyAdminId) redirect('/dashboard')

  const { data: challengesRaw } = await supabase
    .from('challenges').select('*').order('created_at', { ascending: false })
  const { data: academiesRaw } = await supabase
    .from('academies').select('id, name').order('name')

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="bg-[#1A1A1A] border-b border-[#333] px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
        <Link href={isOwner ? '/owner' : '/academia'} className="text-[#666] text-sm">← Voltar</Link>
        <h1 className="text-white font-black text-base flex-1">Gerenciar Desafios</h1>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto pb-10">
        <DesafiosManager
          challenges={(challengesRaw ?? []) as never[]}
          academies={(academiesRaw ?? []) as { id: string; name: string }[]}
          isOwner={isOwner}
          academyAdminId={academyAdminId ?? null}
        />
      </div>
    </div>
  )
}
