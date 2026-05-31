'use client'

import { useState } from 'react'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useStreakShield } from '@/app/streak/actions'

export default function StreakShieldButton({ streak }: { streak: number }) {
  const [used, setUsed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const confirm = useConfirm()

  async function use() {
    const ok = await confirm({
      title: 'Usar Streak Shield?',
      body: `Você está com ${streak} dias de streak. O shield evita que você perca 1 dia sem treino neste mês. Pro feature — 1 uso por mês.`,
      confirmLabel: 'Usar shield',
    })
    if (!ok) return
    setBusy(true); setMsg('')
    const r = await useStreakShield()
    setBusy(false)
    if (r.error === 'pro_required') setMsg('Disponível apenas no plano Pro.')
    else if (r.error === 'already_used_this_month') setMsg('Você já usou o shield este mês.')
    else if (r.error) setMsg(`Erro: ${r.error}`)
    else { setUsed(true); setMsg('✓ Shield aplicado para o mês') }
  }

  if (used) return <p className="text-volt text-[10px] text-center mt-2">🛡 Shield ativo até virar o mês</p>

  return (
    <div className="mt-2 pt-2 border-t border-brand-elev">
      <button onClick={use} disabled={busy}
        className="w-full bg-brand-elev text-volt text-[10px] font-black uppercase tracking-wider py-2 rounded-full hover:bg-brand-hover disabled:opacity-50">
        🛡 {busy ? 'Aplicando...' : 'Usar Streak Shield (Pro)'}
      </button>
      {msg && <p className="text-[10px] text-ink-muted mt-1 text-center">{msg}</p>}
    </div>
  )
}
