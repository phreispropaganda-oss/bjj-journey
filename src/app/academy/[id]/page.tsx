import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BELTS } from '@/lib/curriculum'

interface Academy {
  id: string; name: string; logo_url: string | null;
  city: string | null; state_uf: string | null;
  address: string | null; description: string | null;
  schedule: string | null; website: string | null;
}
interface PublicStats {
  active_students: number
  belt_white: number; belt_blue: number; belt_purple: number; belt_brown: number; belt_black: number
  sessions_30d: number
}
interface Member { user_id: string; role: string }
interface Prof { id: string; name: string; username: string; avatar_url: string | null; belt_id: string }

export default async function AcademyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: acRaw } = await supabase
    .from('academies')
    .select('id, name, logo_url, city, state_uf, address, description, schedule, website')
    .eq('id', id).eq('active', true).maybeSingle()
  const academy = acRaw as Academy | null
  if (!academy) notFound()

  const { data: memRaw } = await supabase
    .from('academy_members').select('user_id, role').eq('academy_id', id).eq('active', true)
  const members = (memRaw ?? []) as Member[]

  const myMembership = members.find(m => m.user_id === user.id)
  const isAdmin = myMembership && ['owner', 'coach'].includes(myMembership.role)

  // Stats publicos
  const { data: statsRaw } = await (supabase as unknown as {
    rpc: (n: string, p: Record<string, string>) => Promise<{ data: PublicStats[] | null }>
  }).rpc('academy_public_stats', { p_academy_id: id })
  const stats = (statsRaw ?? [])[0] ?? {
    active_students: 0, belt_white: 0, belt_blue: 0, belt_purple: 0, belt_brown: 0, belt_black: 0, sessions_30d: 0,
  }

  // Professores (owner + coach)
  const profIds = members.filter(m => ['owner', 'coach'].includes(m.role)).map(m => m.user_id)
  const { data: profsRaw } = profIds.length > 0
    ? await supabase.from('profiles').select('id, name, username, avatar_url, belt_id').in('id', profIds)
    : { data: [] }
  const professors = (profsRaw ?? []) as Prof[]

  // Alunos recentes (ultimos 8 com treino nos 30d)
  const { data: recentRaw } = await supabase
    .from('training_sessions')
    .select('user_id, profiles(id, name, username, avatar_url)')
    .gte('trained_at', new Date(Date.now() - 30 * 86400000).toISOString())
    .order('trained_at', { ascending: false })
    .limit(40)
  type Recent = { user_id: string; profiles: { id: string; name: string; username: string; avatar_url: string | null } | { id: string; name: string; username: string; avatar_url: string | null }[] | null }
  const recentMap = new Map<string, { name: string; username: string; avatar_url: string | null }>()
  const memberIds = new Set(members.map(m => m.user_id))
  for (const r of (recentRaw ?? []) as Recent[]) {
    if (!memberIds.has(r.user_id) || recentMap.has(r.user_id)) continue
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
    if (p) recentMap.set(r.user_id, { name: p.name, username: p.username, avatar_url: p.avatar_url })
    if (recentMap.size >= 8) break
  }
  const recentStudents = Array.from(recentMap.values())

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY
  const addressQuery = encodeURIComponent(
    [academy.address, academy.city, academy.state_uf].filter(Boolean).join(', ')
  )
  const mapEmbedSrc = mapsKey && addressQuery
    ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${addressQuery}`
    : null
  const mapsLink = addressQuery
    ? `https://www.google.com/maps/search/?api=1&query=${addressQuery}`
    : null

  const isVisitor = !myMembership
  const isMember  = !!myMembership

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/dashboard" className="text-ink-muted text-sm min-h-tap flex items-center">←</Link>
        <h1 className="font-display text-base text-ink-primary flex-1 truncate">{academy.name}</h1>
        {isAdmin && (
          <Link href={`/academy/${id}/admin`}
            className="bg-volt text-brand-bg text-xs font-black px-3 py-1.5 rounded-full">
            Editar
          </Link>
        )}
      </div>

      <div className="max-w-2xl mx-auto pb-10">
        {/* Header card */}
        <div className="bg-gradient-to-br from-brand-surface to-brand-bg px-4 py-5 border-b border-brand-elev">
          <div className="flex items-center gap-3 mb-3">
            {academy.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={academy.logo_url} alt={academy.name} className="w-16 h-16 rounded-2xl object-cover border border-brand-elev" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blood flex items-center justify-center text-ink-primary font-display text-2xl">
                {academy.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-ink-primary text-2xl leading-tight">{academy.name}</h2>
              {(academy.city || academy.state_uf) && (
                <p className="text-ink-secondary text-sm">📍 {[academy.city, academy.state_uf].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Sobre */}
          {(isMember || isVisitor) && academy.description && (
            <section className="card-elev">
              <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-2">Sobre</p>
              <p className="text-sm text-ink-primary leading-relaxed">{academy.description}</p>
            </section>
          )}

          {/* Horarios (so membros) */}
          {isMember && academy.schedule && (
            <section className="card-elev">
              <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-2">Horários</p>
              <p className="text-sm text-ink-primary whitespace-pre-line leading-relaxed">{academy.schedule}</p>
            </section>
          )}

          {/* Stats publicos */}
          <section className="grid grid-cols-3 gap-2">
            <div className="card-elev p-3 text-center">
              <p className="font-display text-2xl text-volt">{stats.active_students}</p>
              <p className="text-[10px] uppercase tracking-wider text-ink-muted font-bold mt-0.5">Alunos ativos</p>
            </div>
            <div className="card-elev p-3 text-center">
              <p className="font-display text-2xl text-blood">{stats.sessions_30d}</p>
              <p className="text-[10px] uppercase tracking-wider text-ink-muted font-bold mt-0.5">Treinos 30d</p>
            </div>
            <div className="card-elev p-3 text-center">
              <p className="font-display text-2xl text-ink-primary">{professors.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-ink-muted font-bold mt-0.5">Professores</p>
            </div>
          </section>

          {/* Distribuicao de faixas (so membros) */}
          {isMember && stats.active_students > 0 && (
            <section className="card-elev">
              <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-3">Distribuição de faixas</p>
              <div className="space-y-1.5">
                {BELTS.map(b => {
                  const key = `belt_${b.id}` as keyof PublicStats
                  const count = (stats[key] as number) ?? 0
                  const pct = stats.active_students > 0 ? Math.round((count / stats.active_students) * 100) : 0
                  if (count === 0) return null
                  return (
                    <div key={b.id} className="flex items-center gap-2 text-xs">
                      <span className="w-14 text-ink-secondary">{b.name}</span>
                      <div className="flex-1 h-3 bg-brand-bg rounded-full overflow-hidden">
                        <div className="h-full transition-all" style={{ width: `${pct}%`, background: b.color }} />
                      </div>
                      <span className="text-ink-primary font-bold w-12 text-right">{count} <span className="text-ink-muted">({pct}%)</span></span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Professores (so membros) */}
          {isMember && professors.length > 0 && (
            <section>
              <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-2 px-1">Professores</p>
              <div className="grid grid-cols-2 gap-2">
                {professors.map(p => {
                  const belt = BELTS.find(b => b.id === p.belt_id) ?? BELTS[0]
                  return (
                    <Link key={p.id} href={`/profile/${p.username}`}
                      className="card-elev p-3 flex items-center gap-2.5">
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blood flex items-center justify-center text-ink-primary font-black">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-ink-primary text-sm font-bold truncate">{p.name}</p>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-1.5 rounded-sm" style={{ background: belt.color }} />
                          <span className="text-ink-muted text-[10px]">{belt.name}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Alunos recentes (so membros) */}
          {isMember && recentStudents.length > 0 && (
            <section className="card-elev">
              <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-2">Treinaram recentemente</p>
              <div className="flex -space-x-2">
                {recentStudents.map((s, i) => (
                  <Link key={i} href={`/profile/${s.username}`} title={s.name}
                    className="w-9 h-9 rounded-full border-2 border-brand-surface overflow-hidden bg-brand-bg flex items-center justify-center text-ink-primary text-xs font-black">
                    {s.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.avatar_url} alt={s.name} className="w-full h-full object-cover" />
                    ) : (s.name.charAt(0).toUpperCase())}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Mapa */}
          {addressQuery && (
            <section className="card-elev p-0 overflow-hidden">
              {mapEmbedSrc ? (
                <iframe src={mapEmbedSrc} className="w-full h-64 border-0"
                  loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
              ) : (
                <div className="p-5 text-center">
                  <p className="text-3xl mb-2">🗺️</p>
                  <p className="text-ink-secondary text-sm mb-3">
                    {academy.address ?? academy.city}
                  </p>
                  {mapsLink && (
                    <a href={mapsLink} target="_blank" rel="noopener noreferrer"
                      className="inline-block bg-blood text-ink-primary text-xs font-black px-4 py-2 rounded-full">
                      Ver no Google Maps
                    </a>
                  )}
                </div>
              )}
            </section>
          )}

          {/* CTA fazer parte */}
          {isVisitor && (
            <section className="card-elev text-center">
              <p className="text-3xl mb-1">🥋</p>
              <p className="font-display text-ink-primary mb-2">Quer treinar aqui?</p>
              <p className="text-ink-secondary text-sm mb-3">
                Peça ao professor para te adicionar com seu usuário <strong className="text-volt">@{user.email?.split('@')[0]}</strong>.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
