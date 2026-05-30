import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RequestForm from '@/components/graduacao/RequestForm'

interface VerifRow {
  id: string; belt_id: string; degrees: number; status: string;
  created_at: string; reviewed_at: string | null; reviewer_note: string | null;
}
interface ProfileLite {
  belt_id: string; degrees: number; belt_verified_status: string;
  belt_verified_at: string | null;
}
interface AcademyLite { id: string; name: string }

export default async function GraduacaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('belt_id, degrees, belt_verified_status, belt_verified_at')
    .eq('id', user.id).maybeSingle()
  const profile = profileRaw as ProfileLite | null

  const { data: requestsRaw } = await supabase
    .from('belt_verifications')
    .select('id, belt_id, degrees, status, created_at, reviewed_at, reviewer_note')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)
  const requests = (requestsRaw ?? []) as VerifRow[]

  const { data: memRaw } = await supabase
    .from('academy_members')
    .select('academy_id, academies(id, name)')
    .eq('user_id', user.id)
  type Mem = { academy_id: string; academies: AcademyLite | AcademyLite[] | null }
  const academies = ((memRaw ?? []) as Mem[]).flatMap(m => {
    const a = m.academies
    return Array.isArray(a) ? a : (a ? [a] : [])
  })

  const verified = profile?.belt_verified_status === 'verified'
  const pending  = profile?.belt_verified_status === 'pending'

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/profile" className="text-ink-muted text-sm min-h-tap flex items-center">← Perfil</Link>
        <h1 className="font-display text-base text-ink-primary flex-1">Verificar graduação</h1>
        {verified && <span className="text-volt text-xs font-black">✓ Verificado</span>}
        {pending  && <span className="text-amber-400 text-xs font-black">⏳ Pendente</span>}
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto pb-10 space-y-4">
        {verified && (
          <div className="card-elev bg-volt/10 border-volt/30">
            <p className="text-sm text-ink-primary">
              <strong className="text-volt">✓ Faixa verificada.</strong> Você pode pedir nova verificação se for promovido.
            </p>
          </div>
        )}

        {/* Histórico */}
        {requests.length > 0 && (
          <div className="card-elev">
            <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-3">Histórico</p>
            <div className="space-y-2">
              {requests.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-brand-bg rounded-xl px-3 py-2 border border-brand-elev">
                  <div>
                    <p className="text-sm text-ink-primary font-bold capitalize">{r.belt_id} · {r.degrees}°</p>
                    <p className="text-[10px] text-ink-muted">{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    r.status === 'verified' ? 'bg-volt/20 text-volt' :
                    r.status === 'rejected' ? 'bg-blood/20 text-blood' :
                                              'bg-amber-500/20 text-amber-400'
                  }`}>
                    {r.status === 'verified' ? '✓ Aprovado' : r.status === 'rejected' ? '✗ Rejeitado' : '⏳ Pendente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <RequestForm
          currentBelt={profile?.belt_id ?? 'white'}
          currentDegrees={profile?.degrees ?? 0}
          academies={academies}
          userId={user.id}
          disabled={pending}
        />
      </div>
    </div>
  )
}
