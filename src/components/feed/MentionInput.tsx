'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// PRD §4.2 — Input com autocomplete de @username

interface User {
  id: string; name: string; username: string;
  avatar_url: string | null; belt_id: string
}

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
}

const BELT_COLOR: Record<string, string> = {
  white: '#E8E8E8', blue: '#2563EB', purple: '#7C3AED',
  brown: '#92400E', black: '#1A1A1A',
}

export default function MentionInput({
  value, onChange, onSubmit, placeholder, maxLength = 500, disabled,
}: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const cursorRef = useRef(0)

  // Detecta @ no texto e abre picker
  useEffect(() => {
    const cursor = cursorRef.current
    const before = value.slice(0, cursor)
    const atMatch = before.match(/@([a-z0-9_]{0,40})$/i)
    if (atMatch) {
      setQuery(atMatch[1])
      setShowPicker(true)
    } else {
      setShowPicker(false)
    }
  }, [value])

  // Busca server-side
  useEffect(() => {
    if (!showPicker) return
    let cancel = false
    async function fetch() {
      const supabase = createClient()
      const { data } = await (supabase as unknown as {
        rpc: (n: string, p: Record<string, string | number>) => Promise<{ data: User[] | null }>
      }).rpc('search_users', { p_query: query || '', p_limit: 6 })
      if (!cancel) setUsers(data ?? [])
    }
    fetch()
    return () => { cancel = true }
  }, [showPicker, query])

  function pick(u: User) {
    const cursor = cursorRef.current
    const before = value.slice(0, cursor)
    const after  = value.slice(cursor)
    const newBefore = before.replace(/@([a-z0-9_]{0,40})$/i, `@${u.username} `)
    onChange(newBefore + after)
    setShowPicker(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    cursorRef.current = e.target.selectionStart ?? 0
    onChange(e.target.value)
  }

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        className="w-full bg-brand-bg border border-brand-elev rounded-full px-3 py-2 text-sm
                   outline-none focus:border-blood text-ink-primary placeholder:text-ink-muted"
        placeholder={placeholder ?? 'Comentar...'}
        value={value}
        onChange={handleChange}
        onKeyDown={e => {
          if (e.key === 'Enter' && !showPicker) {
            e.preventDefault()
            onSubmit()
          }
        }}
        onSelect={e => { cursorRef.current = e.currentTarget.selectionStart ?? 0 }}
        maxLength={maxLength}
        disabled={disabled}
      />

      {showPicker && users.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-brand-surface border border-brand-elev rounded-xl shadow-xl overflow-hidden z-20">
          {users.map(u => (
            <button key={u.id} type="button"
              onClick={() => pick(u)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-brand-elev text-left">
              {u.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: BELT_COLOR[u.belt_id] ?? '#555',
                    color: u.belt_id === 'white' ? '#0D0D0D' : 'white' }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-ink-primary truncate">{u.name}</p>
                <p className="text-[10px] text-ink-muted truncate">@{u.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
