'use client'

import { useState } from 'react'

export default function StripePortalLink() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function open() {
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/stripe/portal', { method: 'POST' })
      const j = await r.json() as { url?: string; error?: string }
      if (j.url) { window.location.href = j.url; return }
      if (j.error === 'stripe_disabled') setError('Pagamentos ainda não ativos.')
      else if (j.error === 'no_customer') setError('Você não tem assinatura ativa.')
      else setError('Erro ao abrir portal.')
    } catch {
      setError('Erro de rede.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={open} disabled={loading}
        className="w-full bg-brand-surface rounded-2xl border border-brand-elev p-3 flex items-center justify-between active:bg-brand-elev min-h-tap">
        <div>
          <p className="text-ink-primary text-sm font-bold">💳 Assinatura</p>
          <p className="text-[10px] text-ink-muted mt-0.5">
            {loading ? 'Abrindo portal...' : 'Gerenciar plano e pagamento'}
          </p>
        </div>
        <span className="text-ink-muted text-sm">›</span>
      </button>
      {error && <p className="text-blood text-[10px] mt-1 text-center">{error}</p>}
    </div>
  )
}
