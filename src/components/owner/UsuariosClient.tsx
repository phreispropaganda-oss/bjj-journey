'use client'

import { useState, useTransition } from 'react'
import { setUserActive, softDeleteUser, restoreUser } from '@/app/owner/actions'

interface Profile {
  id: string; name: string; username: string; belt_id: string; degrees: number;
  xp: number; streak: number; academy_name: string | null;
  is_public: boolean; active: boolean; deleted_at: string | null;
  created_at: string;
}

interface Props {
  profiles: Profile[]
  beltColor: Record<string, string>
  currentUserId: string
}

type Filter = 'all' | 'active' | 'inactive' | 'deleted'

export default function UsuariosClient({ profiles, beltColor, currentUserId }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  const filtered = profiles.filter(p => {
    if (filter === 'active'   && !p.active)            return false
    if (filter === 'inactive' && (p.active || p.deleted_at)) return false
    if (filter === 'deleted'  && !p.deleted_at)        return false
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())
              && !p.username?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function showFeedback(r: { ok?: boolean; error?: string }, okMsg: string) {
    if (r.error) setFeedback({ kind: 'err', msg: r.error })
    else setFeedback({ kind: 'ok', msg: okMsg })
    setTimeout(() => setFeedback(null), 3000)
  }

  function toggleActive(p: Profile) {
    startTransition(async () => {
      const r = await setUserActive(p.id, !p.active)
      showFeedback(r, `${p.name} ${p.active ? 'inativado' : 'ativado'}`)
    })
  }

  function handleDelete(p: Profile) {
    if (confirmDelete !== p.id) { setConfirmDelete(p.id); return }
    startTransition(async () => {
      const r = await softDeleteUser(p.id)
      showFeedback(r, `${p.name} excluído`)
      setConfirmDelete(null)
    })
  }

  function handleRestore(p: Profile) {
    startTransition(async () => {
      const r = await restoreUser(p.id)
      showFeedback(r, `${p.name} restaurado`)
    })
  }

  const counts = {
    all:      profiles.length,
    active:   profiles.filter(p => p.active && !p.deleted_at).length,
    inactive: profiles.filter(p => !p.active && !p.deleted_at).length,
    deleted:  profiles.filter(p => p.deleted_at).length,
  }

  return (
    <div className="space-y-3">
      {/* Feedback toast */}
      {feedback && (
        <div className={`rounded-xl px-3 py-2 text-sm font-bold ${
          feedback.kind === 'ok'
            ? 'bg-green-900/30 border border-green-700 text-green-400'
            : 'bg-red-900/30 border border-red-700 text-red-400'
        }`}>
          {feedback.kind === 'ok' ? '✓' : '⚠️'} {feedback.msg}
        </div>
      )}

      {/* Search */}
      <input
        className="w-full bg-brand-elev border border-brand-elev rounded-xl px-3 py-2.5 text-white text-sm outline-none placeholder:text-ink-secondary focus:border-rise"
        placeholder="Buscar por nome ou username..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {([
          { v: 'all',      l: 'Todos' },
          { v: 'active',   l: 'Ativos' },
          { v: 'inactive', l: 'Inativos' },
          { v: 'deleted',  l: 'Excluídos' },
        ] as { v: Filter; l: string }[]).map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              filter === f.v ? 'bg-rise text-white' : 'bg-brand-elev text-ink-muted'
            }`}>
            {f.l} <span className="opacity-60">· {counts[f.v]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-ink-secondary text-sm">Nenhum usuário encontrado.</p>
        ) : filtered.map(p => {
          const isSelf = p.id === currentUserId
          const isDeleted = !!p.deleted_at
          return (
            <div key={p.id} className="px-4 py-3 border-b border-[#1E1E1E] last:border-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0"
                  style={{ background: beltColor[p.belt_id] ?? '#555',
                    color: p.belt_id === 'white' ? '#0D0D0D' : 'white' }}>
                  {(p.name?.charAt(0) ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white text-sm font-bold truncate">{p.name || 'Sem nome'}</p>
                    {isSelf && <span className="text-[9px] bg-rise text-white px-1.5 py-0.5 rounded font-bold">VOCÊ</span>}
                  </div>
                  <p className="text-ink-secondary text-[10px]">@{p.username} · {p.xp} XP · {p.streak}d</p>
                </div>
                <div className="flex-shrink-0">
                  {isDeleted ? (
                    <span className="bg-red-900/40 text-red-400 text-[10px] px-2 py-1 rounded-full font-black">Excluído</span>
                  ) : p.active ? (
                    <span className="bg-green-900/40 text-green-400 text-[10px] px-2 py-1 rounded-full font-black">Ativo</span>
                  ) : (
                    <span className="bg-yellow-900/40 text-yellow-400 text-[10px] px-2 py-1 rounded-full font-black">Inativo</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!isSelf && (
                <div className="flex gap-1.5 mt-2.5">
                  {isDeleted ? (
                    <button onClick={() => handleRestore(p)} disabled={pending}
                      className="flex-1 bg-brand-elev hover:bg-[#2A2A2A] border border-brand-elev text-white text-xs font-bold py-1.5 rounded-lg">
                      ↺ Restaurar
                    </button>
                  ) : (
                    <>
                      <button onClick={() => toggleActive(p)} disabled={pending}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-lg border ${
                          p.active ? 'bg-yellow-900/30 border-yellow-700 text-yellow-400'
                          : 'bg-green-900/30 border-green-700 text-green-400'
                        }`}>
                        {p.active ? '⏸ Inativar' : '▶ Ativar'}
                      </button>
                      <button onClick={() => handleDelete(p)} disabled={pending}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-lg border ${
                          confirmDelete === p.id
                            ? 'bg-red-700 border-red-600 text-white animate-pulse'
                            : 'bg-red-900/30 border-red-800 text-red-400'
                        }`}>
                        {confirmDelete === p.id ? '⚠️ Confirmar?' : '🗑 Excluir'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-ink-secondary text-[10px] text-center pt-2">
        Exclusão é soft-delete: o registro é mantido para auditoria. Use Restaurar para reverter.
      </p>
    </div>
  )
}
