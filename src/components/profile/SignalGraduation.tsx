'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BELTS } from '@/lib/curriculum'
import type { BeltId } from '@/lib/supabase/types'

interface Props {
  currentBelt: string
  currentDegrees: number
  username: string
  appUrl: string
}

export default function SignalGraduation({ currentBelt, currentDegrees, username, appUrl }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [toBelt, setToBelt] = useState<BeltId>(currentBelt as BeltId)
  const [toDegrees, setToDegrees] = useState(currentDegrees)
  const [note, setNote] = useState('')
  const [saving, startSaving] = useTransition()
  const [done, setDone] = useState(false)

  const beltObj = BELTS.find(b => b.id === toBelt) ?? BELTS[0]
  const profileUrl = `${appUrl}/profile/${username}`

  function submit() {
    startSaving(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await (supabase.from('graduation_signals') as ReturnType<typeof supabase.from>).insert({
        user_id: user.id,
        to_belt: toBelt,
        to_degrees: toDegrees,
        note: note || null,
      } as never)

      await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
        .update({ belt_id: toBelt, degrees: toDegrees } as never)
        .eq('id', user.id)

      setDone(true)
      router.refresh()
    })
  }

  function shareWhatsApp() {
    const text = `🥋 Acabei de ser graduado para Faixa ${beltObj.name}, ${toDegrees}° grau no Belt Rise!\n${profileUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full bg-gradient-to-r from-[#CC0000] to-[#E52222] text-white font-black py-3.5 rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
        🏅 Fui graduado!
      </button>
    )
  }

  if (done) {
    return (
      <div className="bg-volt/15 border border-[#86EFAC] rounded-2xl p-4 space-y-3">
        <div className="text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-black text-volt-deep text-base">Graduação registrada!</p>
          <p className="text-xs text-ink-secondary mt-1">Faixa {beltObj.name}, {toDegrees}° grau</p>
        </div>
        <div className="flex gap-2">
          <button onClick={shareWhatsApp}
            className="flex-1 bg-green-500 text-white font-black py-2.5 rounded-full text-sm">
            📱 WhatsApp
          </button>
          <button onClick={() => { setOpen(false); setDone(false) }}
            className="px-4 bg-white border border-brand-elev rounded-full text-sm font-bold text-ink-secondary">
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-brand-surface rounded-2xl p-4 shadow-sm space-y-3 border-2 border-rise/30">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary">Sinalizar graduação</p>
        <button onClick={() => setOpen(false)} className="text-ink-muted text-lg">✕</button>
      </div>

      {/* Belt selector */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary block mb-2">Nova faixa</label>
        <div className="grid grid-cols-5 gap-1.5">
          {BELTS.map(b => (
            <button key={b.id} onClick={() => { setToBelt(b.id); setToDegrees(0) }}
              className={`py-3 rounded-xl border-2 transition-all ${
                toBelt === b.id ? 'border-rise bg-rise/10' : 'border-brand-elev'
              }`}>
              <div className="w-6 h-3 mx-auto rounded-sm" style={{ background: b.color }} />
              <p className="text-[9px] font-black mt-1">{b.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Degrees */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary block mb-2">
          Grau na faixa {beltObj.name}
        </label>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: beltObj.maxDeg + 1 }, (_, i) => (
            <button key={i} onClick={() => setToDegrees(i)}
              className={`w-9 h-9 rounded-full border-2 font-black text-sm transition-all ${
                toDegrees === i ? 'bg-rise border-rise text-white' : 'border-brand-elev'
              }`}>
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary block mb-1.5">Observação</label>
        <input
          className="w-full bg-brand-bg border border-brand-elev rounded-xl px-3 py-2 text-sm outline-none focus:border-rise"
          placeholder="Ex: Aprovado pelo mestre João"
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={200} />
      </div>

      <button onClick={submit} disabled={saving}
        className="w-full bg-rise text-white font-black py-3 rounded-full text-sm disabled:opacity-50">
        {saving ? 'Registrando...' : '🏅 Registrar e compartilhar'}
      </button>
    </div>
  )
}
