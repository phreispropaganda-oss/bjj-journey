import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ReviewClient from '@/components/graduacao/ReviewClient'

interface VerifRow {
  id: string; user_id: string; belt_id: string; degrees: number;
  modality: string; proof_url: string | null; proof_kind: string;
  instructor_name: string | null; academy_id: string | null;
  graduated_at: string | null; notes: string | null;
  status: string; created_at: string;
}
interface ProfileLite { id: string; name: string; username: string; avatar_url: string | null; belt_id: string; degrees: number }
interface AcademyLite { id: string; name: string }

export default async function RevisarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Academias onde sou owner/coach
  const { data: memRaw } = await supabase
    .from('academy_members')
    .select('academy_id, role, academies(id, name)')
    .eq('user_id', user.id)
    .in('role', ['owner', 'coach'])
  type Mem = { academy_id: string; role: string; academies: AcademyLite | AcademyLite[] | null }
  const myAcademies = ((memRaw ?? []) as Mem[]).flatMap(m => {
    const a = m.academies
    return Array.isArray(a) ? a : (a ? [a] : [])
  })

  const { data: isAdmin } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()

  if (myAcademies.length === 0 && !isAdmin) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-5xl mb-3">🔒</p>
          <p className="font-display text-ink-primary mb-1">Sem permissão</p>
          <p className="text-sm text-ink-secondary mb-4">Só professores e admins revisam graduações.</p>
          <Link href="/dashboard" className="text-blood text-sm font-bold">Voltar</Link>
        </div>
      </div>
    )
  }

  const academyIds = myAcademies.map(a => a.id)
  let query = supabase
    .from('belt_verifications')
    .select('id, user_id, belt_id, degrees, modality, proof_url, proof_kind, instructor_name, academy_id, graduated_at, notes, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (!isAdmin && academyIds.length > 0) query = query.in('academy_id', academyIds)

  const { data: requestsRaw } = await query
  const requests = (requestsRaw ?? []) as VerifRow[]

  const userIds = [...new Set(requests.map(r => r.user_id))]
  const { data: profsRaw } = userIds.length > 0
    ? await supabase.from('profiles').select('id, name, username, avatar_url, belt_id, degrees').in('id', userIds)
    : { data: [] }
  const profMap: Record<string, ProfileLite> = {}
  ;((profsRaw ?? []) as ProfileLite[]).forEach(p => { profMap[p.id] = p })

  const academyMap: Record<string, string> = {}
  myAcademies.forEach(a => { academyMap[a.id] = a.name })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/academia" className="text-ink-muted text-sm min-h-tap flex items-center">← Academia</Link>
        <h1 className="font-display text-base text-ink-primary flex-1">Revisar graduações</h1>
        <span className="bg-amber-500/20 text-amber-400 text-xs font-black px-2.5 py-1 rounded-full">
          {requests.filter(r => r.status === 'pending').length} pendentes
        </span>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto pb-10">
        <ReviewClient requests={requests} profileMap={profMap} academyMap={academyMap} />
      </div>
    </div>
  )
}
