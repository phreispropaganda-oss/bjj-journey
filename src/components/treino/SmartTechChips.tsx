'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// PRD §2.3 — Chips inteligentes com algoritmo top user + gym + explore

interface Chip { tag: string; source: 'user' | 'gym' | 'explore'; weight: number }

interface Props {
  selected: string[]
  onToggle: (tag: string) => void
  modality?: string
}

const SOURCE_META: Record<string, { emoji: string; label: string; color: string }> = {
  user:    { emoji: '⭐', label: 'Seu',      color: 'blood' },
  gym:     { emoji: '🏢', label: 'Academia', color: 'volt' },
  explore: { emoji: '🧭', label: 'Sugerido', color: 'ink-muted' },
}

export default function SmartTechChips({ selected, onToggle, modality = 'bjj' }: Props) {
  const [chips, setChips] = useState<Chip[]>([])
  const [loading, setLoading] = useState(true)
  const [customInput, setCustomInput] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await (supabase as unknown as {
        rpc: (n: string, p: Record<string, string>) => Promise<{ data: Chip[] | null }>
      }).rpc('suggested_techniques', { p_user_id: user.id, p_modality: modality })
      setChips((data ?? []))
      setLoading(false)
    }
    load()
  }, [modality])

  function handleAddCustom() {
    const t = customInput.trim()
    if (!t) return
    if (!selected.includes(t)) onToggle(t)
    setCustomInput('')
    setShowCustom(false)
  }

  // Misturar selecionados que não estão nos chips
  const allTags = [
    ...selected.filter(s => !chips.some(c => c.tag === s))
      .map(s => ({ tag: s, source: 'user' as const, weight: 999 })),
    ...chips,
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-ink-secondary">
          Posições treinadas
        </span>
        <button type="button"
          onClick={() => setShowCustom(s => !s)}
          className="text-[11px] text-blood font-black">
          {showCustom ? 'Cancelar' : '+ Outra'}
        </button>
      </div>

      {/* Input para tag custom */}
      {showCustom && (
        <div className="flex gap-2">
          <input autoFocus
            className="field-input flex-1"
            placeholder="Ex: De la Riva inversa"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
            maxLength={60} />
          <button type="button" onClick={handleAddCustom}
            className="btn-volt min-h-[44px] px-4 text-sm">
            Adicionar
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-ink-muted">Carregando sugestões…</p>
      ) : allTags.length === 0 ? (
        <p className="text-xs text-ink-muted">
          Adicione técnicas treinadas tocando em sugestões ou usando &ldquo;+ Outra&rdquo;.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map(c => {
            const isSel = selected.includes(c.tag)
            const meta = SOURCE_META[c.source] ?? SOURCE_META.explore
            return (
              <button key={c.tag}
                type="button"
                onClick={() => onToggle(c.tag)}
                className={`flex items-center gap-1 rounded-full text-xs font-bold transition-all
                  min-h-[36px] px-3 py-1.5 ${
                  isSel
                    ? 'bg-blood text-ink-primary border border-blood shadow-glow-blood'
                    : 'bg-brand-elev text-ink-secondary border border-border hover:bg-brand-hover'
                }`}>
                {!isSel && <span className="text-[10px] opacity-60">{meta.emoji}</span>}
                <span>{c.tag}</span>
                {isSel && <span className="text-[10px] ml-0.5">✕</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Legenda */}
      <div className="flex items-center gap-3 text-[10px] text-ink-muted">
        <span>⭐ Seu</span>
        <span>🏢 Academia</span>
        <span>🧭 Sugerido</span>
      </div>
    </div>
  )
}
