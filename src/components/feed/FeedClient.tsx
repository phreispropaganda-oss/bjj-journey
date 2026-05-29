'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toggleOss, postComment } from '@/app/feed/actions'

interface ProfileLite {
  id: string; name: string; username: string;
  belt_id: string; degrees: number; academy_name: string | null;
}
interface CommentItem {
  id: string; session_id: string; user_id: string;
  text: string; created_at: string; author?: ProfileLite;
}
interface Item {
  session: {
    id: string; type: string; duration_min: number; trained_at: string;
    instructor: string | null; techniques: string[];
    rolls: number; subs_for: number; subs_against: number;
    feeling: number | null; note: string | null; photo_url: string | null;
  };
  author?: ProfileLite;
  kudosCount: number;
  iOssed: boolean;
  comments: CommentItem[];
  typeMeta: { emoji: string; label: string };
}

function timeAgo(iso: string): string {
  const d  = new Date(iso)
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

export default function FeedClient({
  item, currentUserId, currentUsername, beltColor, beltName,
}: {
  item: Item
  currentUserId: string
  currentUsername: string
  beltColor: Record<string, string>
  beltName: Record<string, string>
}) {
  const [optimisticOssed, setOptimisticOssed] = useState(item.iOssed)
  const [optimisticCount, setOptimisticCount] = useState(item.kudosCount)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState(item.comments)
  const [newComment, setNewComment] = useState('')
  const [pendingOss, startOssTransition] = useTransition()
  const [pendingComment, startCommentTransition] = useTransition()

  const a = item.author
  if (!a) return null
  const beltC = beltColor[a.belt_id] ?? '#888'
  const beltN = beltName[a.belt_id]  ?? a.belt_id

  function handleOss() {
    setOptimisticOssed(o => !o)
    setOptimisticCount(c => c + (optimisticOssed ? -1 : 1))
    startOssTransition(() => { toggleOss(item.session.id) })
  }

  function handlePostComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || !a) return
    const text = newComment.trim()
    const tempComment: CommentItem = {
      id: `temp-${Date.now()}`,
      session_id: item.session.id,
      user_id: currentUserId,
      text,
      created_at: new Date().toISOString(),
      author: { id: currentUserId, name: 'Você', username: currentUsername, belt_id: a.belt_id, degrees: 0, academy_name: null },
    }
    setComments(c => [...c, tempComment])
    setNewComment('')
    startCommentTransition(() => { postComment(item.session.id, text) })
  }

  const initial = (a?.name?.charAt(0) ?? '?').toUpperCase()

  return (
    <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header: author + time */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href={`/profile/${a.username}`}
          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0"
          style={{ background: beltC === '#E8E8E8' ? '#CC0000' : beltC,
                   color: a.belt_id === 'white' ? '#0D0D0D' : 'white' }}>
          {initial}
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${a.username}`} className="text-sm font-black text-[#0D0D0D] truncate block">
            {a.name}
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-[#888]">
            <div className="w-2.5 h-1.5 rounded-sm border border-black/10" style={{ background: beltC }} />
            <span>Faixa {beltN}</span>
            {a.academy_name && <span>· {a.academy_name}</span>}
            <span>· {timeAgo(item.session.trained_at)}</span>
          </div>
        </div>
      </div>

      {/* Type badge + duration */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <span className="bg-[#0D0D0D] text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
          {item.typeMeta.emoji} {item.typeMeta.label}
        </span>
        <span className="bg-[#FFF0F0] text-[#CC0000] text-xs font-black px-3 py-1.5 rounded-full">
          ⏱ {item.session.duration_min}min
        </span>
        {item.session.feeling && (
          <span className="bg-[#F8F7F5] text-[#555] text-base rounded-full w-7 h-7 flex items-center justify-center"
            title={`Sensação ${item.session.feeling}/5`}>
            {FEELING_EMOJI[item.session.feeling]}
          </span>
        )}
      </div>

      {/* Note */}
      {item.session.note && (
        <p className="px-4 text-sm text-[#333] leading-relaxed mb-3">{item.session.note}</p>
      )}

      {/* Photo */}
      {item.session.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.session.photo_url} alt="" className="w-full aspect-[4/3] object-cover" />
      )}

      {/* Techniques */}
      {item.session.techniques.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#AAA] mb-2">
            Técnicas treinadas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {item.session.techniques.slice(0, 6).map(t => (
              <span key={t} className="bg-[#F2F0ED] text-[#555] text-[11px] font-bold rounded-full px-2.5 py-1">
                {t}
              </span>
            ))}
            {item.session.techniques.length > 6 && (
              <span className="text-[#AAA] text-[11px] font-bold px-2 py-1">
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
            { v: item.session.rolls,        l: 'Rolas',      color: '#CC0000' },
            { v: item.session.subs_for,     l: 'Finalizei',  color: '#16A34A' },
            { v: item.session.subs_against, l: 'Sofridos',   color: '#F59E0B' },
          ].map(s => (
            <div key={s.l} className="bg-[#F8F7F5] rounded-xl py-2 text-center">
              <p className="font-black text-lg" style={{ color: s.color }}>{s.v}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#888]">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions: Oss + Comment */}
      <div className="border-t border-[#F2F0ED] px-4 py-2.5 flex items-center gap-4">
        <button onClick={handleOss} disabled={pendingOss}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm transition-all ${
            optimisticOssed
              ? 'bg-[#CC0000] text-white shadow-md shadow-red-900/20'
              : 'text-[#555] hover:bg-[#F8F7F5]'
          }`}>
          <span className="text-base">👊</span>
          <span>{optimisticOssed ? 'Oss!' : 'Oss'}</span>
          {optimisticCount > 0 && <span className="text-xs opacity-80">· {optimisticCount}</span>}
        </button>
        <button onClick={() => setShowComments(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm text-[#555] hover:bg-[#F8F7F5]">
          <span className="text-base">💬</span>
          <span>{comments.length > 0 ? comments.length : 'Comentar'}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-[#F2F0ED] px-4 py-3 space-y-2 bg-[#FAFAF8]">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2 items-start">
              <Link href={c.author ? `/profile/${c.author.username}` : '#'}
                className="w-7 h-7 rounded-full bg-[#CC0000] flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                {(c.author?.name?.charAt(0) ?? '?').toUpperCase()}
              </Link>
              <div className="flex-1 bg-white rounded-2xl px-3 py-2">
                <p className="text-[11px] font-black text-[#0D0D0D]">{c.author?.name ?? 'Atleta'}</p>
                <p className="text-sm text-[#333] leading-snug">{c.text}</p>
              </div>
            </div>
          ))}
          <form onSubmit={handlePostComment} className="flex gap-2 mt-2">
            <input
              className="flex-1 bg-white border border-[#E5E5E5] rounded-full px-3 py-2 text-sm outline-none focus:border-[#CC0000]"
              placeholder="Comentar..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              maxLength={500}
            />
            <button type="submit" disabled={pendingComment || !newComment.trim()}
              className="bg-[#CC0000] text-white font-black px-4 py-2 rounded-full text-xs disabled:opacity-40">
              Enviar
            </button>
          </form>
        </div>
      )}
    </article>
  )
}
