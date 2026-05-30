import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CheckinClient from '@/components/checkin/CheckinClient'
import { findAcademyByQrToken } from './actions'

interface OpenVisit { id: string; academy_id: string; entered_at: string; academies: { name: string } | { name: string }[] | null }

export default async function CheckinPage({
  searchParams,
}: { searchParams: Promise<{ qr?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const qrAcademy = sp.qr ? await findAcademyByQrToken(sp.qr) : null

  const { data: openRaw } = await supabase
    .from('gym_visits')
    .select('id, academy_id, entered_at, academies(name)')
    .eq('user_id', user.id).is('left_at', null)
    .order('entered_at', { ascending: false }).limit(1).maybeSingle()
  const open = openRaw as OpenVisit | null
  const openAcademyName = open
    ? (Array.isArray(open.academies) ? open.academies[0]?.name : open.academies?.name) ?? 'Academia'
    : null

  const { data: histRaw } = await supabase
    .from('gym_visits')
    .select('id, entered_at, duration_min, source, session_id, academies(name)')
    .eq('user_id', user.id).not('left_at', 'is', null)
    .order('entered_at', { ascending: false }).limit(10)
  type Hist = { id: string; entered_at: string; duration_min: number | null; source: string; session_id: string | null; academies: { name: string } | { name: string }[] | null }
  const history = ((histRaw ?? []) as Hist[]).map(h => ({
    id: h.id, entered_at: h.entered_at, duration_min: h.duration_min ?? 0,
    source: h.source, session_id: h.session_id,
    academy_name: (Array.isArray(h.academies) ? h.academies[0]?.name : h.academies?.name) ?? 'Academia',
  }))

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/dashboard" className="text-ink-muted text-sm min-h-tap flex items-center">← Início</Link>
        <h1 className="font-display text-base text-ink-primary flex-1">Check-in</h1>
        {open && <span className="bg-volt/20 text-volt text-xs font-black px-2 py-1 rounded-full">no tatame</span>}
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto pb-10 space-y-4">
        <CheckinClient
          openVisit={open ? { id: open.id, academyId: open.academy_id, academyName: openAcademyName!, enteredAt: open.entered_at } : null}
          qrAcademy={qrAcademy}
          history={history}
        />
      </div>
    </div>
  )
}
