'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BELTS } from '@/lib/curriculum'

interface UserResult { id: string; username: string; name: string; avatar_url: string | null; belt_id: string; degrees: number }

export default function SearchUsersClient() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q.trim() || q.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      // RPC search_users existe (Etapa 6 do PRD)
      const { data } = await (supabase as unknown as {
        rpc: (n: string, p: Record<string, string | number>) => Promise<{ data: UserResult[] | null }>
      }).rpc('search_users', { p_query: q, p_limit: 30 })
      setResults((data ?? []) as UserResult[])
      setLoading(false)
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="space-y-3">
      <input
        autoFocus
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Buscar usuário por nome ou @username"
        className="field-input"
      />

      {q.length === 0 && (
        <div className="card-elev text-center py-8">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-ink-secondary text-sm">Digite o nome ou @username</p>
        </div>
      )}

      {q.length > 0 && q.length < 2 && (
        <p className="text-ink-muted text-xs text-center">Digite pelo menos 2 caracteres</p>
      )}

      {loading && <p className="text-ink-muted text-xs text-center">Buscando...</p>}

      {q.length >= 2 && !loading && results.length === 0 && (
        <p className="text-ink-secondary text-sm text-center py-4">Nenhum usuário encontrado.</p>
      )}

      <div className="space-y-1.5">
        {results.map(u => {
          const belt = BELTS.find(b => b.id === u.belt_id) ?? BELTS[0]
          return (
            <Link key={u.id} href={`/profile/${u.username}`}
              className="flex items-center gap-3 bg-brand-surface rounded-2xl p-3 border border-brand-elev active:bg-brand-elev">
              {u.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.avatar_url} alt={u.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-rise flex items-center justify-center text-white font-display text-lg">
                  {(u.name?.charAt(0) ?? '?').toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-ink-primary font-bold text-sm truncate">{u.name}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-1.5 rounded-sm" style={{ background: belt.color }} />
                  <span className="text-ink-muted text-[11px]">@{u.username}</span>
                  {u.degrees > 0 && <span className="text-ink-muted text-[10px]">· {u.degrees}°</span>}
                </div>
              </div>
              <span className="text-ink-muted text-sm">›</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
