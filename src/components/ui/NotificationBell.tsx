'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Notif {
  id: string; type: string; created_at: string; read_at: string | null;
  actor_id: string | null; payload: Record<string, unknown>;
  actor?: { name: string; username: string; avatar_url: string | null };
}

const TYPE_META: Record<string, { emoji: string; label: (n: Notif) => string; href: (n: Notif) => string }> = {
  kudos: {
    emoji: '👊',
    label: n => `${n.actor?.name ?? 'Alguém'} mandou Oss no seu treino!`,
    href:  n => `/feed#session-${(n.payload?.session_id as string) ?? ''}`,
  },
  comment: {
    emoji: '💬',
    label: n => `${n.actor?.name ?? 'Alguém'} comentou: "${(n.payload?.text as string) ?? ''}"`,
    href:  n => `/feed#session-${(n.payload?.session_id as string) ?? ''}`,
  },
  follow: {
    emoji: '➕',
    label: n => `${n.actor?.name ?? 'Alguém'} começou a te seguir`,
    href:  n => `/profile/${n.actor?.username ?? ''}`,
  },
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.read_at).length

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: notifsRaw } = await supabase
        .from('notifications')
        .select('id, type, created_at, read_at, actor_id, payload')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      const list = (notifsRaw ?? []) as Notif[]
      const actorIds = [...new Set(list.map(n => n.actor_id).filter(Boolean))] as string[]
      if (actorIds.length) {
        const { data: actors } = await supabase
          .from('profiles').select('id, name, username, avatar_url').in('id', actorIds)
        const actorMap: Record<string, { name: string; username: string; avatar_url: string | null }> = {}
        ;((actors ?? []) as { id: string; name: string; username: string; avatar_url: string | null }[]).forEach(a => {
          actorMap[a.id] = { name: a.name, username: a.username, avatar_url: a.avatar_url }
        })
        list.forEach(n => { if (n.actor_id) n.actor = actorMap[n.actor_id] })
      }
      setNotifs(list)
    }
    load()
    const interval = setInterval(load, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [open])

  async function markAllRead() {
    if (unread === 0) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await (supabase.from('notifications') as ReturnType<typeof supabase.from>)
      .update({ read_at: new Date().toISOString() } as never)
      .eq('user_id', user.id).is('read_at', null)
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    setLoading(false)
  }

  return (
    <div ref={popoverRef} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="w-9 h-9 rounded-full bg-[#F8F7F5] hover:bg-[#F2F0ED] flex items-center justify-center relative transition-colors">
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#CC0000] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-xl border border-[#E5E5E5] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2F0ED]">
            <p className="text-sm font-black tracking-tight">Notificações</p>
            {unread > 0 && (
              <button onClick={markAllRead} disabled={loading}
                className="text-[11px] text-[#CC0000] font-black">
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-none">
            {notifs.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-sm text-[#555] font-bold">Sem notificações</p>
                <p className="text-xs text-[#AAA]">Quando alguém interagir, você verá aqui.</p>
              </div>
            ) : notifs.map(n => {
              const meta = TYPE_META[n.type]
              if (!meta) return null
              return (
                <Link key={n.id} href={meta.href(n)} onClick={() => setOpen(false)}
                  className={`flex items-start gap-2 px-4 py-3 border-b border-[#F2F0ED] last:border-none hover:bg-[#F8F7F5] transition-colors ${
                    !n.read_at ? 'bg-[#FFF0F0]/40' : ''
                  }`}>
                  {!n.read_at && <div className="w-2 h-2 bg-[#CC0000] rounded-full mt-1.5 flex-shrink-0" />}
                  <span className="text-base flex-shrink-0">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#0D0D0D] leading-snug line-clamp-2">{meta.label(n)}</p>
                    <p className="text-[10px] text-[#AAA] mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
