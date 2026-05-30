'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { BELTS } from '@/lib/curriculum'
import { reviewBeltVerification, getProofSignedUrl } from '@/app/graduacao/actions'

interface VerifRow {
  id: string; user_id: string; belt_id: string; degrees: number;
  modality: string; proof_url: string | null; proof_kind: string;
  instructor_name: string | null; academy_id: string | null;
  graduated_at: string | null; notes: string | null;
  status: string; created_at: string;
}
interface ProfileLite { id: string; name: string; username: string; avatar_url: string | null; belt_id: string; degrees: number }

interface Props {
  requests: VerifRow[]
  profileMap: Record<string, ProfileLite>
  academyMap: Record<string, string>
}

export default function ReviewClient({ requests, profileMap, academyMap }: Props) {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState('')
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({})
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  const visible = filter === 'pending' ? requests.filter(r => r.status === 'pending') : requests

  async function viewProof(r: VerifRow) {
    if (!r.proof_url) return
    if (proofUrls[r.id]) { window.open(proofUrls[r.id], '_blank'); return }
    const res = await getProofSignedUrl(r.proof_url)
    if (res.url) {
      setProofUrls(p => ({ ...p, [r.id]: res.url! }))
      window.open(res.url, '_blank')
    }
  }

  function decide(id: string, status: 'verified' | 'rejected', note?: string) {
    startTransition(async () => {
      const res = await reviewBeltVerification(id, status, note)
      if (res.error) { setFeedback(`⚠️ ${res.error}`); return }
      setFeedback(status === 'verified' ? '✓ Graduação aprovada' : '✗ Pedido rejeitado')
      setNoteFor(null); setNoteText('')
      setTimeout(() => setFeedback(''), 2500)
    })
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <div className="bg-blood/15 border border-blood/30 text-blood px-3 py-2 rounded-xl text-sm font-bold">
          {feedback}
        </div>
      )}

      <div className="flex gap-2">
        {(['pending', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-full text-xs font-black min-h-tap ${
              filter === f ? 'bg-blood text-ink-primary' : 'bg-brand-elev text-ink-secondary'
            }`}>
            {f === 'pending' ? `⏳ Pendentes (${requests.filter(r => r.status === 'pending').length})` : `📋 Todos (${requests.length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card-elev text-center py-10">
          <p className="text-4xl mb-2">✨</p>
          <p className="font-display text-ink-primary">Nenhum pedido {filter === 'pending' ? 'pendente' : ''}</p>
        </div>
      ) : (
        visible.map(r => {
          const p = profileMap[r.user_id]
          const beltNew = BELTS.find(b => b.id === r.belt_id) ?? BELTS[0]
          const beltCur = p ? (BELTS.find(b => b.id === p.belt_id) ?? BELTS[0]) : null
          const acadName = r.academy_id ? academyMap[r.academy_id] : null
          return (
            <div key={r.id} className="card-elev space-y-3">
              {/* athlete */}
              <div className="flex items-center gap-3">
                {p?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blood flex items-center justify-center text-ink-primary font-black">
                    {p?.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-ink-primary font-bold text-sm">{p?.name ?? 'Atleta'}</p>
                  <Link href={`/profile/${p?.username}`} className="text-ink-muted text-xs">@{p?.username}</Link>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  r.status === 'verified' ? 'bg-volt/20 text-volt' :
                  r.status === 'rejected' ? 'bg-blood/20 text-blood' :
                                            'bg-amber-500/20 text-amber-400'
                }`}>
                  {r.status}
                </span>
              </div>

              {/* belt change */}
              <div className="flex items-center gap-3 bg-brand-bg rounded-xl p-3 border border-brand-elev">
                {beltCur && (
                  <div className="flex-1 text-center">
                    <p className="text-[9px] text-ink-muted uppercase">Atual</p>
                    <div className="w-12 h-3 rounded-sm mx-auto mt-1 mb-1" style={{ background: beltCur.color }} />
                    <p className="text-xs text-ink-secondary">{beltCur.name} · {p?.degrees ?? 0}°</p>
                  </div>
                )}
                <span className="text-ink-muted text-lg">→</span>
                <div className="flex-1 text-center">
                  <p className="text-[9px] text-volt uppercase">Pedido</p>
                  <div className="w-12 h-3 rounded-sm mx-auto mt-1 mb-1" style={{ background: beltNew.color }} />
                  <p className="text-xs text-ink-primary font-bold">{beltNew.name} · {r.degrees}°</p>
                </div>
              </div>

              {/* details */}
              <div className="text-xs text-ink-secondary space-y-1">
                {r.instructor_name && <p><span className="text-ink-muted">Prof.:</span> <strong className="text-ink-primary">{r.instructor_name}</strong></p>}
                {acadName && <p><span className="text-ink-muted">Academia:</span> <strong className="text-ink-primary">{acadName}</strong></p>}
                {r.graduated_at && <p><span className="text-ink-muted">Data:</span> {new Date(r.graduated_at).toLocaleDateString('pt-BR')}</p>}
                {r.notes && <p className="italic">&ldquo;{r.notes}&rdquo;</p>}
              </div>

              {/* proof */}
              {r.proof_url && (
                <button onClick={() => viewProof(r)}
                  className="w-full bg-brand-elev text-ink-primary text-xs font-black py-2 rounded-full min-h-tap">
                  🔗 Ver comprovante {r.proof_kind === 'document' ? '(PDF)' : '(foto)'}
                </button>
              )}

              {/* actions */}
              {r.status === 'pending' && (
                noteFor === r.id ? (
                  <div className="space-y-2">
                    <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                      placeholder="Motivo da rejeição..." rows={2} maxLength={300}
                      className="field-input" />
                    <div className="flex gap-2">
                      <button onClick={() => { setNoteFor(null); setNoteText('') }}
                        className="flex-1 bg-brand-elev text-ink-secondary font-black py-2 rounded-full text-xs min-h-tap">
                        Cancelar
                      </button>
                      <button onClick={() => decide(r.id, 'rejected', noteText)} disabled={pending}
                        className="flex-1 bg-blood text-ink-primary font-black py-2 rounded-full text-xs min-h-tap disabled:opacity-40">
                        Confirmar rejeição
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setNoteFor(r.id)} disabled={pending}
                      className="flex-1 bg-brand-elev text-ink-secondary font-black py-2 rounded-full text-xs min-h-tap disabled:opacity-40">
                      Rejeitar
                    </button>
                    <button onClick={() => decide(r.id, 'verified')} disabled={pending}
                      className="flex-1 bg-volt text-brand-bg font-black py-2 rounded-full text-xs min-h-tap disabled:opacity-40">
                      ✓ Aprovar graduação
                    </button>
                  </div>
                )
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
