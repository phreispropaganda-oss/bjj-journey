'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface StoryUser {
  user_id: string
  username: string
  name: string
  avatar_url: string | null
  trained_at: string
}

/**
 * Stories bar Strava-style — mostra avatares de quem treinou nas ultimas 36h.
 * Tocar leva para perfil do usuario. Botao "+" leva pra /treino/novo.
 */
export default function StoriesBar({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<StoryUser[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const since = new Date(Date.now() - 36 * 3600 * 1000).toISOString()
      const { data } = await supabase
        .from('training_sessions')
        .select('user_id, trained_at, profiles!inner(username, name, avatar_url)')
        .gte('trained_at', since)
        .neq('user_id', currentUserId)
        .neq('visibility', 'private')
        .order('trained_at', { ascending: false })
        .limit(50)

      type Row = {
        user_id: string
        trained_at: string
        profiles: { username: string; name: string; avatar_url: string | null }
          | { username: string; name: string; avatar_url: string | null }[]
          | null
      }
      const rows = (data ?? []) as Row[]
      const seen = new Set<string>()
      const list: StoryUser[] = []
      for (const r of rows) {
        if (seen.has(r.user_id)) continue
        seen.add(r.user_id)
        const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
        if (!p) continue
        list.push({
          user_id: r.user_id,
          username: p.username,
          name: p.name,
          avatar_url: p.avatar_url,
          trained_at: r.trained_at,
        })
        if (list.length >= 10) break
      }
      setUsers(list)
    }
    void load()
  }, [currentUserId])

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none -mx-4 px-4 pb-3 mb-3">
      <Link href="/treino/novo"
        className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[60px]">
        <div className="w-14 h-14 rounded-full bg-rise/15 border-2 border-rise/40 flex items-center justify-center">
          <span className="text-rise text-2xl font-display leading-none">+</span>
        </div>
        <span className="text-[10px] font-bold text-ink-secondary leading-none">Você</span>
      </Link>

      {users.map(u => (
        <Link key={u.user_id} href={`/profile/${u.username}`}
          className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[60px]">
          <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-rise to-rise-deep">
            <div className="w-full h-full rounded-full bg-brand-bg p-0.5">
              {u.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.avatar_url} alt={u.name}
                  className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-brand-elev flex items-center justify-center text-ink-primary font-display text-base">
                  {(u.name?.charAt(0) ?? '?').toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold text-ink-secondary leading-none truncate w-full text-center">
            {u.name?.split(' ')[0] ?? u.username}
          </span>
        </Link>
      ))}
    </div>
  )
}
