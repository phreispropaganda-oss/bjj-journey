'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { resolveReport, setShadowBan } from '@/app/moderacao/actions'
import { useConfirm } from '@/components/ui/ConfirmDialog'

interface ReportRow {
  id: string
  reporter_id: string
  target_id: string
  target_kind: 'session' | 'comment' | 'profile' | 'academy'
  target_user_id: string | null
  reason: string
  description: string | null
  status: 'pending' | 'approved' | 'dismissed'
  created_at: string
}
interface ProfileLite {
  id: string; name: string; username: string;
  belt_id: string; avatar_url: string | null;
  shadow_banned: boolean; report_count: number;
}
interface SessionLite { id: string; note: string | null; photo_url: string | null; visibility: string }
interface CommentLite { id: string; text: string; session_id: string }

interface Props {
  reports: ReportRow[]
  profileMap: Record<string, ProfileLite>
  sessionMap: Record<string, SessionLite>
  commentMap: Record<string, CommentLite>
}

const REASON_LABEL: Record<string, string> = {
  spam:           'Spam',
  harassment:     'Assédio',
  hate:           'Ódio',
  nudity:         'Nudez',
  violence:       'Violência',
  impersonation:  'Personificação',
  misinformation: 'Info falsa',
  illegal:        'Ilegal',
  other:          'Outro',
}

const KIND_EMOJI: Record<string, string> = {
  session: '🥋', comment: '💬', profile: '👤', academy: '🏢',
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.floor(ms / 3600000)
  if (h < 1) return 'agora há pouco'
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

export default function ModeracaoClient({ reports, profileMap, sessionMap, commentMap }: Props) {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState('')
  const confirm = useConfirm()

  const visible = filter === 'pending'
    ? reports.filter(r => r.status === 'pending')
    : reports

  function handleResolve(r: ReportRow, status: 'approved' | 'dismissed') {
    startTransition(async () => {
      const res = await resolveReport(r.id, status)
      if (res.error) { setFeedback(`⚠️ ${res.error}`); return }
      setFeedback(status === 'approved' ? '✓ Aprovado — contagem de reports atualizada' : '✓ Rejeitado')
      setTimeout(() => setFeedback(''), 2500)
    })
  }

  async function handleBan(userId: string, banned: boolean) {
    const ok = await confirm({
      title: banned ? 'Aplicar shadow-ban?' : 'Remover shadow-ban?',
      body: banned
        ? 'O usuário continua usando o app, mas seu conteúdo desaparece para outros.'
        : 'O usuário volta a ser visível no feed e rankings.',
      confirmLabel: banned ? 'Banir' : 'Remover ban',
      destructive: banned,
    })
    if (!ok) return
    startTransition(async () => {
      const r = await setShadowBan(userId, banned)
      if (r.error) { setFeedback(`⚠️ ${r.error}`); return }
      setFeedback(banned ? '✓ Shadow-ban aplicado' : '✓ Shadow-ban removido')
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

      {/* Tabs filtro */}
      <div className="flex gap-2">
        {(['pending', 'all'] as const).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-full text-xs font-black min-h-tap ${
              filter === f ? 'bg-blood text-ink-primary' : 'bg-brand-elev text-ink-secondary'
            }`}>
            {f === 'pending' ? `🔥 Pendentes (${reports.filter(r => r.status === 'pending').length})` : `📋 Todos (${reports.length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card-elev text-center py-10">
          <p className="text-4xl mb-2">✨</p>
          <p className="font-display text-ink-primary">Tudo limpo</p>
          <p className="text-sm text-ink-secondary mt-1">Nenhuma denúncia {filter === 'pending' ? 'pendente' : ''}.</p>
        </div>
      ) : (
        visible.map(r => {
          const reporter = profileMap[r.reporter_id]
          const target   = r.target_user_id ? profileMap[r.target_user_id] : null
          const session  = r.target_kind === 'session' ? sessionMap[r.target_id] : null
          const comment  = r.target_kind === 'comment' ? commentMap[r.target_id] : null

          return (
            <div key={r.id} className="card-elev">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{KIND_EMOJI[r.target_kind]}</span>
                <span className="bg-brand-bg text-ink-secondary text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-brand-elev">
                  {r.target_kind}
                </span>
                <span className="bg-blood/20 text-blood text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  {REASON_LABEL[r.reason] ?? r.reason}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  r.status === 'pending'   ? 'bg-amber-500/20 text-amber-400' :
                  r.status === 'approved'  ? 'bg-volt/20 text-volt' :
                                             'bg-ink-muted/20 text-ink-muted'
                }`}>
                  {r.status}
                </span>
                <span className="ml-auto text-[10px] text-ink-muted">{timeAgo(r.created_at)}</span>
              </div>

              {/* Conteúdo reportado */}
              <div className="bg-brand-bg rounded-xl p-3 border border-brand-elev mb-3">
                {session && (
                  <>
                    {session.note && <p className="text-sm text-ink-primary mb-1">&ldquo;{session.note}&rdquo;</p>}
                    {session.photo_url && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={session.photo_url} alt="" className="w-full aspect-[16/10] object-cover rounded-lg" />
                    )}
                    <p className="text-[10px] text-ink-muted mt-1">Treino · {session.visibility}</p>
                  </>
                )}
                {comment && (
                  <p className="text-sm text-ink-primary">&ldquo;{comment.text}&rdquo;</p>
                )}
                {r.target_kind === 'profile' && target && (
                  <p className="text-sm text-ink-primary">
                    Perfil <strong>@{target.username}</strong>
                  </p>
                )}
              </div>

              {/* Descrição extra */}
              {r.description && (
                <div className="bg-brand-bg/50 rounded-xl px-3 py-2 mb-3 border border-brand-elev/50">
                  <p className="text-[10px] uppercase text-ink-muted font-bold mb-1">Detalhes do reporter</p>
                  <p className="text-sm text-ink-secondary">{r.description}</p>
                </div>
              )}

              {/* Quem reportou + autor do conteúdo */}
              <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                <div>
                  <p className="text-ink-muted">Reportado por</p>
                  {reporter ? (
                    <Link href={`/profile/${reporter.username}`} className="text-ink-primary font-bold">
                      @{reporter.username}
                    </Link>
                  ) : <p className="text-ink-muted">—</p>}
                </div>
                <div>
                  <p className="text-ink-muted">Autor</p>
                  {target ? (
                    <Link href={`/profile/${target.username}`} className="text-ink-primary font-bold flex items-center gap-1">
                      @{target.username}
                      {target.report_count > 0 && (
                        <span className="text-[9px] text-blood bg-blood/15 px-1 rounded">
                          {target.report_count} reports
                        </span>
                      )}
                      {target.shadow_banned && (
                        <span className="text-[9px] text-amber-400">🚫</span>
                      )}
                    </Link>
                  ) : <p className="text-ink-muted">—</p>}
                </div>
              </div>

              {/* Ações */}
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleResolve(r, 'dismissed')} disabled={pending}
                    className="flex-1 bg-brand-elev text-ink-secondary font-black py-2 rounded-full text-xs disabled:opacity-40 min-h-tap">
                    Rejeitar
                  </button>
                  <button onClick={() => handleResolve(r, 'approved')} disabled={pending}
                    className="flex-1 bg-blood text-ink-primary font-black py-2 rounded-full text-xs disabled:opacity-40 min-h-tap">
                    Aprovar
                  </button>
                  {target && (
                    <button onClick={() => handleBan(target.id, !target.shadow_banned)} disabled={pending}
                      className={`flex-1 font-black py-2 rounded-full text-xs disabled:opacity-40 min-h-tap ${
                        target.shadow_banned
                          ? 'bg-volt text-brand-bg'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                      {target.shadow_banned ? '✓ Remover ban' : 'Shadow-ban'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}

      <p className="text-[10px] text-ink-muted text-center pt-2">
        🛡️ Sistema: 3 reports aprovados em 30 dias → shadow-ban automático.
        Conteúdo de shadow-banned é oculto do feed público e rankings.
      </p>
    </div>
  )
}
