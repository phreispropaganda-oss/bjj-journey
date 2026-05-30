'use client'

import { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toggleOss, postComment, deleteComment } from '@/app/feed/actions'
import { deleteTrainingSession, updateSessionVisibility } from '@/app/treino/actions'
import { createClient } from '@/lib/supabase/client'
import SparksOverlay from './SparksOverlay'
import MentionInput from './MentionInput'
import ReportDialog from './ReportDialog'
import { renderMentions } from './renderMentions'

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

interface ProfileLite {
  id: string; name: string; username: string;
  belt_id: string; degrees: number; academy_name: string | null;
  avatar_url?: string | null
}
interface CommentItem {
  id: string; session_id: string; user_id: string;
  text: string; created_at: string; reply_to?: string | null;
  author?: ProfileLite;
}
interface Item {
  session: {
    id: string; user_id: string; type: string; duration_min: number; trained_at: string;
    instructor: string | null; techniques: string[];
    rolls: number; subs_for: number; subs_against: number;
    feeling: number | null; note: string | null; photo_url: string | null;
    visibility?: 'public' | 'followers' | 'private';
  };
  author?: ProfileLite;
  kudosCount: number;
  superOssCount?: number;
  iOssed: boolean;
  iSuperOssed?: boolean;
  comments: CommentItem[];
  typeMeta: { emoji: string; label: string };
}

// ────────────────────────────────────────────────────────────────
// Utils
// ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const d = new Date(iso)
  const ms = Date.now() - d.getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d`
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

const FEELING_EMOJI: Record<number, string> = { 1:'😫', 2:'😐', 3:'🙂', 4:'💪', 5:'🔥' }

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────

export default function FeedClient({
  item, currentUserId, currentUsername, beltColor, beltName,
}: {
  item: Item
  currentUserId: string
  currentUsername: string
  beltColor: Record<string, string>
  beltName: Record<string, string>
}) {
  const router = useRouter()

  // Estado otimista de Oss/Super Oss
  const [iOssed, setIOssed] = useState(item.iOssed)
  const [iSuperOssed, setISuperOssed] = useState(item.iSuperOssed ?? false)
  const [ossCount, setOssCount] = useState(item.kudosCount)
  const [superOssCount, setSuperOssCount] = useState(item.superOssCount ?? 0)

  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReport, setShowReport] = useState<'session' | 'profile' | null>(null)
  const [removed, setRemoved] = useState(false)
  const [comments, setComments] = useState(item.comments)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; authorName: string } | null>(null)
  const [sparksTrigger, setSparksTrigger] = useState(0)
  const [sparksPos, setSparksPos] = useState({ x: 0, y: 0 })

  const cardRef = useRef<HTMLElement>(null)
  const lastTap = useRef(0)
  const [pendingOss, startOssTransition] = useTransition()
  const [pendingComment, startCommentTransition] = useTransition()

  const isAuthor = item.session.user_id === currentUserId
  const a = item.author

  // ── Realtime: subscribe a inserts/deletes de kudos+comments da sessão ──
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`session-${item.session.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kudos',
          filter: `session_id=eq.${item.session.id}` },
        (payload) => {
          const k = payload.new as { user_id: string; kind: 'oss' | 'super_oss' }
          if (k.user_id === currentUserId) return  // já tratado otimista
          if (k.kind === 'super_oss') setSuperOssCount(c => c + 1)
          else setOssCount(c => c + 1)
        })
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'kudos',
          filter: `session_id=eq.${item.session.id}` },
        (payload) => {
          const k = payload.old as { user_id: string; kind: 'oss' | 'super_oss' }
          if (k.user_id === currentUserId) return
          if (k.kind === 'super_oss') setSuperOssCount(c => Math.max(0, c - 1))
          else setOssCount(c => Math.max(0, c - 1))
        })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments',
          filter: `session_id=eq.${item.session.id}` },
        async (payload) => {
          const c = payload.new as CommentItem
          if (c.user_id === currentUserId) return  // já adicionado otimista
          // Carrega o autor
          const { data: auth } = await supabase.from('profiles')
            .select('id, name, username, belt_id, degrees, academy_name, avatar_url')
            .eq('id', c.user_id).maybeSingle()
          setComments(prev => prev.some(x => x.id === c.id) ? prev : [...prev, { ...c, author: (auth ?? undefined) as ProfileLite | undefined }])
        })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [item.session.id, currentUserId])

  // ── Handler Oss (1 tap = oss, double-tap = super_oss) ──
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now()
    const delta = now - lastTap.current
    lastTap.current = now

    // Posição relativa ao card para sparks
    const rect = cardRef.current?.getBoundingClientRect()
    const evt = ('touches' in e ? e.touches[0] : e) as { clientX: number; clientY: number }
    const x = rect ? evt.clientX - rect.left : 0
    const y = rect ? evt.clientY - rect.top : 0
    setSparksPos({ x, y })

    if (delta < 350 && delta > 30) {
      // Double-tap = SUPER OSS!
      triggerSuperOss()
    } else {
      // Aguardar segundo tap antes de fazer Oss simples
      setTimeout(() => {
        if (Date.now() - lastTap.current >= 340) {
          triggerOss()
        }
      }, 350)
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  function triggerOss() {
    if (iSuperOssed) {
      // Remove super_oss
      setISuperOssed(false)
      setSuperOssCount(c => Math.max(0, c - 1))
      startOssTransition(() => { void toggleOss(item.session.id, 'super_oss') })
      return
    }
    if (iOssed) {
      setIOssed(false)
      setOssCount(c => Math.max(0, c - 1))
    } else {
      setIOssed(true)
      setOssCount(c => c + 1)
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15)
    }
    startOssTransition(() => { void toggleOss(item.session.id, 'oss') })
  }

  function triggerSuperOss() {
    if (iSuperOssed) {
      // Já é super → remove
      setISuperOssed(false)
      setSuperOssCount(c => Math.max(0, c - 1))
      startOssTransition(() => { void toggleOss(item.session.id, 'super_oss') })
      return
    }
    // Se tinha Oss simples, vira super
    if (iOssed) setOssCount(c => Math.max(0, c - 1))
    setIOssed(false)
    setISuperOssed(true)
    setSuperOssCount(c => c + 1)
    setSparksTrigger(t => t + 1)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 20, 40, 20, 80])
    }
    startOssTransition(() => { void toggleOss(item.session.id, 'super_oss') })
  }

  // ── Comment ──
  function handlePostComment(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!newComment.trim() || !a) return
    const text = newComment.trim()
    const tempId = `temp-${Date.now()}`
    const tempComment: CommentItem = {
      id: tempId,
      session_id: item.session.id,
      user_id: currentUserId,
      text,
      created_at: new Date().toISOString(),
      reply_to: replyTo?.id ?? null,
      author: { id: currentUserId, name: 'Você', username: currentUsername,
                belt_id: a.belt_id, degrees: 0, academy_name: null },
    }
    setComments(c => [...c, tempComment])
    setNewComment('')
    const replyId = replyTo?.id
    setReplyTo(null)
    startCommentTransition(async () => {
      await postComment(item.session.id, text, replyId)
    })
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Apagar este comentário?')) return
    const r = await deleteComment(commentId)
    if (r.error) { alert('Erro: ' + r.error); return }
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  async function handleDeleteSession() {
    if (!confirm('Apagar este treino? Esta ação não pode ser desfeita.')) return
    const r = await deleteTrainingSession(item.session.id)
    if (r.error) { alert('Erro ao apagar: ' + r.error); return }
    setRemoved(true)
    setShowMenu(false)
    router.refresh()
  }

  async function handleVisibility(v: 'public' | 'followers' | 'private') {
    setShowMenu(false)
    const r = await updateSessionVisibility(item.session.id, v)
    if (r.error) { alert('Erro: ' + r.error); return }
    router.refresh()
  }

  if (removed || !a) return null

  const beltC = beltColor[a.belt_id] ?? '#888'
  const beltN = beltName[a.belt_id] ?? a.belt_id
  const initial = (a?.name?.charAt(0) ?? '?').toUpperCase()
  const currentVisibility = item.session.visibility ?? 'followers'
  const VISIBILITY_META: Record<string, { icon: string; label: string }> = {
    public:    { icon: '🌍', label: 'Global' },
    followers: { icon: '👥', label: 'Seguidores' },
    private:   { icon: '🔒', label: 'Privado' },
  }

  // Threading: separar root e replies
  const rootComments = comments.filter(c => !c.reply_to)
  const repliesByParent: Record<string, CommentItem[]> = {}
  for (const c of comments) {
    if (c.reply_to) {
      ;(repliesByParent[c.reply_to] ??= []).push(c)
    }
  }

  return (
    <article ref={cardRef} className="card-elev relative overflow-hidden p-0">

      {/* Sparks overlay para Super Oss! */}
      <SparksOverlay trigger={sparksTrigger} x={sparksPos.x} y={sparksPos.y} />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href={`/profile/${a.username}`}
          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0"
          style={{ background: beltC === '#E8E8E8' ? 'var(--blood)' : beltC,
                   color: a.belt_id === 'white' ? 'var(--bg-base)' : 'white' }}>
          {a.avatar_url
            /* eslint-disable-next-line @next/next/no-img-element */
            ? <img src={a.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            : initial}
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${a.username}`} className="font-display text-sm text-ink-primary truncate block">
            {a.name}
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
            <div className="w-2.5 h-1.5 rounded-sm border border-black/30" style={{ background: beltC }} />
            <span>Faixa {beltN}</span>
            {a.academy_name && <span className="truncate">· {a.academy_name}</span>}
            <span>· {timeAgo(item.session.trained_at)}</span>
            {isAuthor && (
              <span className="ml-1" title={VISIBILITY_META[currentVisibility].label}>
                · {VISIBILITY_META[currentVisibility].icon}
              </span>
            )}
          </div>
        </div>

        <div className="relative flex-shrink-0">
          <button onClick={() => setShowMenu(s => !s)}
            className="w-9 h-9 rounded-full hover:bg-brand-elev flex items-center justify-center text-ink-muted font-black min-h-tap min-w-tap">
            ⋯
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 w-52 bg-brand-surface rounded-2xl shadow-xl border border-brand-elev z-40 overflow-hidden">
                {isAuthor ? (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-wider text-ink-muted px-3 pt-3 pb-1">Visibilidade</p>
                    {(['public','followers','private'] as const).map(v => (
                      <button key={v} onClick={() => handleVisibility(v)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-brand-elev ${
                          currentVisibility === v ? 'bg-blood/10' : ''
                        }`}>
                        <span>{VISIBILITY_META[v].icon}</span>
                        <span className="font-bold text-ink-primary">{VISIBILITY_META[v].label}</span>
                        {currentVisibility === v && <span className="ml-auto text-blood text-xs">✓</span>}
                      </button>
                    ))}
                    <div className="border-t border-brand-elev" />
                    <button onClick={handleDeleteSession}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-950/30 font-bold">
                      <span>🗑</span> Apagar treino
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setShowReport('session'); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-3 py-3 text-sm hover:bg-brand-elev text-ink-primary font-bold">
                      <span>⚠️</span> Reportar treino
                    </button>
                    <button onClick={() => { setShowReport('profile'); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-3 py-3 text-sm hover:bg-brand-elev text-ink-primary font-bold border-t border-brand-elev">
                      <span>🚫</span> Reportar perfil
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Report dialog */}
      {showReport === 'session' && (
        <ReportDialog
          targetId={item.session.id}
          targetKind="session"
          onClose={() => setShowReport(null)} />
      )}
      {showReport === 'profile' && a && (
        <ReportDialog
          targetId={a.id}
          targetKind="profile"
          onClose={() => setShowReport(null)} />
      )}

      {/* Type badge + duration */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        <span className="bg-brand-bg text-ink-primary text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-brand-elev">
          {item.typeMeta.emoji} {item.typeMeta.label}
        </span>
        <span className="bg-blood/15 text-blood text-xs font-black px-3 py-1.5 rounded-full">
          ⏱ {item.session.duration_min}min
        </span>
        {item.session.feeling && (
          <span className="bg-brand-bg text-ink-secondary text-base rounded-full w-7 h-7 flex items-center justify-center border border-brand-elev"
            title={`Sensação ${item.session.feeling}/5`}>
            {FEELING_EMOJI[item.session.feeling]}
          </span>
        )}
      </div>

      {/* Note */}
      {item.session.note && (
        <p className="px-4 text-sm text-ink-primary leading-relaxed mb-3">{item.session.note}</p>
      )}

      {/* Photo — double-tap aqui para Super Oss */}
      {item.session.photo_url && (
        <div onClick={handleTap}
          onTouchEnd={handleTap}
          className="cursor-pointer select-none active:opacity-95">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.session.photo_url} alt="" className="w-full aspect-[4/3] object-cover" />
        </div>
      )}

      {/* Techniques */}
      {item.session.techniques.length > 0 && (
        <div className="px-4 pb-3 pt-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-ink-muted mb-2">
            Posições treinadas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {item.session.techniques.slice(0, 6).map(t => (
              <span key={t} className="bg-brand-bg text-ink-secondary text-[11px] font-bold rounded-full px-2.5 py-1 border border-brand-elev">
                {t}
              </span>
            ))}
            {item.session.techniques.length > 6 && (
              <span className="text-ink-muted text-[11px] font-bold px-2 py-1">
                +{item.session.techniques.length - 6}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats row */}
      {(item.session.rolls > 0 || item.session.subs_for > 0 || item.session.subs_against > 0) && (
        <div className="grid grid-cols-3 gap-1 px-4 pb-3">
          {[
            { v: item.session.rolls,        l: 'Rolas',     color: 'text-blood' },
            { v: item.session.subs_for,     l: 'Finalizei', color: 'text-volt' },
            { v: item.session.subs_against, l: 'Sofridos',  color: 'text-warning' },
          ].map(s => (
            <div key={s.l} className="bg-brand-bg rounded-xl py-2 text-center border border-brand-elev">
              <p className={`font-display text-lg ${s.color === 'text-warning' ? 'text-amber-400' : s.color}`}>{s.v}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions: Oss + Super Oss + Comment */}
      <div className="border-t border-brand-elev px-4 py-2.5 flex items-center gap-2">
        <button onClick={handleTap}
          disabled={pendingOss}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-black text-sm transition-all min-h-tap select-none ${
            iSuperOssed
              ? 'bg-volt text-brand-bg shadow-glow-volt'
              : iOssed
                ? 'bg-blood text-ink-primary shadow-glow-blood'
                : 'text-ink-secondary hover:bg-brand-elev'
          }`}>
          <span className="text-base">{iSuperOssed ? '⚡' : '👊'}</span>
          <span>{iSuperOssed ? 'Super Oss!' : iOssed ? 'Oss!' : 'Oss'}</span>
          {(ossCount + superOssCount) > 0 && (
            <span className="text-xs opacity-80">· {ossCount + superOssCount}</span>
          )}
        </button>
        <button onClick={() => setShowComments(s => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full font-black text-sm text-ink-secondary hover:bg-brand-elev min-h-tap">
          <span className="text-base">💬</span>
          <span>{comments.length > 0 ? comments.length : 'Comentar'}</span>
        </button>
        <span className="ml-auto text-[10px] text-ink-muted hidden sm:inline">
          2 toques = Super Oss!
        </span>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-brand-elev px-4 py-3 space-y-2 bg-brand-bg/50">
          {rootComments.map(c => (
            <CommentNode key={c.id}
              comment={c}
              replies={repliesByParent[c.id] ?? []}
              currentUserId={currentUserId}
              onReply={(name) => setReplyTo({ id: c.id, authorName: name })}
              onDelete={handleDeleteComment} />
          ))}

          {/* Compose */}
          {replyTo && (
            <div className="flex items-center justify-between text-[10px] text-ink-muted bg-brand-elev rounded-full px-3 py-1.5 mb-1">
              <span>Respondendo a <strong className="text-ink-primary">@{replyTo.authorName}</strong></span>
              <button onClick={() => setReplyTo(null)} className="text-blood font-bold">✕</button>
            </div>
          )}
          <form onSubmit={handlePostComment} className="flex gap-2 mt-2">
            <MentionInput
              value={newComment}
              onChange={setNewComment}
              onSubmit={() => handlePostComment()}
              placeholder={replyTo ? `Responder @${replyTo.authorName}…` : 'Comentar... (use @ para mencionar)'}
              disabled={pendingComment} />
            <button type="submit" disabled={pendingComment || !newComment.trim()}
              className="bg-blood text-ink-primary font-black px-4 py-2 rounded-full text-xs disabled:opacity-40 min-h-tap">
              Enviar
            </button>
          </form>
        </div>
      )}
    </article>
  )
}

// ────────────────────────────────────────────────────────────────
// Sub-component: comment node with replies
// ────────────────────────────────────────────────────────────────

function CommentNode({
  comment, replies, currentUserId, onReply, onDelete,
}: {
  comment: CommentItem
  replies: CommentItem[]
  currentUserId: string
  onReply: (authorName: string) => void
  onDelete: (id: string) => void
}) {
  const a = comment.author
  const isOwn = comment.user_id === currentUserId
  const initial = (a?.name?.charAt(0) ?? '?').toUpperCase()

  return (
    <div className="space-y-1.5">
      <CommentItemRow comment={comment} isOwn={isOwn} initial={initial} onReply={onReply} onDelete={onDelete} />
      {replies.length > 0 && (
        <div className="pl-9 space-y-1.5">
          {replies.map(r => (
            <CommentItemRow key={r.id}
              comment={r}
              isOwn={r.user_id === currentUserId}
              initial={(r.author?.name?.charAt(0) ?? '?').toUpperCase()}
              onReply={onReply}
              onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function CommentItemRow({
  comment, isOwn, initial, onReply, onDelete,
}: {
  comment: CommentItem
  isOwn: boolean
  initial: string
  onReply: (authorName: string) => void
  onDelete: (id: string) => void
}) {
  const a = comment.author
  return (
    <div className="flex gap-2 items-start">
      <Link href={a ? `/profile/${a.username}` : '#'}
        className="w-7 h-7 rounded-full bg-blood flex items-center justify-center text-ink-primary text-[10px] font-black flex-shrink-0 mt-0.5">
        {a?.avatar_url
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={a.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          : initial}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-brand-surface rounded-2xl px-3 py-2 border border-brand-elev">
          <p className="text-[11px] font-black text-ink-primary">{a?.name ?? 'Atleta'}</p>
          <p className="text-sm text-ink-primary leading-snug break-words">
            {renderMentions(comment.text)}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-2 text-[10px]">
          <span className="text-ink-muted">{timeAgo(comment.created_at)}</span>
          <button onClick={() => onReply(a?.username ?? '')}
            className="text-ink-secondary font-bold hover:text-blood">
            Responder
          </button>
          {isOwn && (
            <button onClick={() => onDelete(comment.id)}
              className="text-ink-muted hover:text-red-400">
              Apagar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
