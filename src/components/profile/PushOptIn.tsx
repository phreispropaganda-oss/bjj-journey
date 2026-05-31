'use client'

import { useState, useEffect } from 'react'
import { subscribeToPush } from '@/lib/push'

export default function PushOptIn() {
  const [status, setStatus] = useState<'idle' | 'subscribing' | 'on' | 'off' | 'denied'>('idle')

  useEffect(() => {
    if (typeof Notification === 'undefined') { setStatus('off'); return }
    setStatus(Notification.permission === 'granted' ? 'on' :
              Notification.permission === 'denied' ? 'denied' : 'off')
  }, [])

  async function enable() {
    setStatus('subscribing')
    const r = await subscribeToPush()
    if (r.ok) setStatus('on')
    else if (r.reason === 'denied') setStatus('denied')
    else setStatus('off')
  }

  const ready = status === 'off'
  const enabled = status === 'on'
  const denied = status === 'denied'

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-elev p-3 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-ink-primary text-sm font-bold flex items-center gap-2">
          🔔 Notificações
          {enabled && <span className="text-volt text-[10px]">ativadas</span>}
          {denied && <span className="text-blood text-[10px]">bloqueadas</span>}
        </p>
        <p className="text-[10px] text-ink-muted mt-0.5">
          Streak quebrando, Oss recebido, marcos de treino
        </p>
      </div>
      {ready && (
        <button onClick={enable} className="bg-rise text-white font-black text-xs px-4 py-2 rounded-full min-h-tap">
          Ativar
        </button>
      )}
      {status === 'subscribing' && (
        <span className="text-ink-muted text-xs">Solicitando...</span>
      )}
      {enabled && (
        <span className="text-volt text-xl">✓</span>
      )}
      {denied && (
        <span className="text-ink-muted text-[10px] text-right">
          Permita nas<br/>config do navegador
        </span>
      )}
    </div>
  )
}
