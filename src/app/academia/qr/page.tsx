import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface AcademyLite { id: string; name: string; qr_token: string }

export default async function AcademyQrPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memRaw } = await supabase
    .from('academy_members')
    .select('academy_id, role, academies(id, name, qr_token)')
    .eq('user_id', user.id).in('role', ['owner', 'coach'])
  type Mem = { academy_id: string; role: string; academies: AcademyLite | AcademyLite[] | null }
  const academies = ((memRaw ?? []) as Mem[]).flatMap(m => {
    const a = m.academies
    return Array.isArray(a) ? a : (a ? [a] : [])
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bjj-journey-iota.vercel.app'

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/academia" className="text-ink-muted text-sm">← Academia</Link>
        <h1 className="font-display text-base text-ink-primary flex-1">QR Check-in</h1>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto pb-10 space-y-4">
        {academies.length === 0 ? (
          <div className="card-elev text-center py-10">
            <p className="text-5xl mb-2">🔒</p>
            <p className="font-display text-ink-primary mb-1">Sem permissão</p>
            <p className="text-sm text-ink-secondary">Só professores e donos têm QR de academia.</p>
          </div>
        ) : academies.map(a => {
          const url = `${appUrl}/checkin?qr=${a.qr_token}`
          const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=${encodeURIComponent(url)}`
          return (
            <div key={a.id} className="card-elev text-center">
              <p className="font-display text-ink-primary text-lg mb-3">{a.name}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImg} alt={`QR ${a.name}`} className="w-64 h-64 mx-auto bg-brand-surface rounded-2xl p-3" />
              <p className="text-xs text-ink-secondary mt-3">Imprima e cole na entrada do tatame.</p>
              <p className="text-[10px] text-ink-muted mt-1 break-all">{url}</p>
              <a href={qrImg} download={`qr-${a.name}.png`}
                className="inline-block mt-3 bg-blood text-ink-primary text-xs font-black px-4 py-2 rounded-full min-h-tap">
                ⬇ Baixar PNG
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
