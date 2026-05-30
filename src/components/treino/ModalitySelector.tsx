'use client'

import { MODALITY_META, type Modality } from '@/lib/supabase/types'

// PRD §1.3 — Seletor multi-modalidade
// Por enquanto: MVP libera BJJ, restantes virão em fases

const ENABLED: Modality[] = ['bjj', 'muay_thai', 'boxe', 'judo']

interface Props {
  value: Modality
  onChange: (m: Modality) => void
}

export default function ModalitySelector({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary">
        Modalidade
      </p>
      <div className="grid grid-cols-4 gap-2">
        {ENABLED.map(m => {
          const meta = MODALITY_META[m]
          const isSel = value === m
          return (
            <button key={m}
              type="button"
              onClick={() => onChange(m)}
              className={`py-2.5 rounded-xl border-2 text-center transition-all min-h-tap ${
                isSel
                  ? 'border-blood bg-blood/10'
                  : 'border-brand-elev bg-brand-surface'
              }`}>
              <div className="text-lg">{meta.emoji}</div>
              <p className={`text-[10px] font-black mt-0.5 ${isSel ? 'text-blood' : 'text-ink-secondary'}`}>
                {meta.label}
              </p>
            </button>
          )
        })}
      </div>
      <p className="text-[10px] text-ink-muted">
        Mais modalidades em breve. Use o seletor acima por hoje.
      </p>
    </div>
  )
}
