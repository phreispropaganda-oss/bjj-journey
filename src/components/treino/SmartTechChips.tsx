'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Chip { tag: string; source: 'user' | 'gym' | 'explore'; weight: number }
interface SearchResult { id: string; name: string; category: string; belt_min: string; score: number }

interface Props {
  selected: string[]
  onToggle: (tag: string) => void
  modality?: string
}

const CATEGORY_LABEL: Record<string, string> = {
  guarda: 'Guardas',
  passagem: 'Passagens',
  top: 'Posições top',
  finalizacao: 'Finalizações (braço)',
  estrangulamento: 'Estrangulamentos',
  leglock: 'Leg locks',
  raspagem: 'Raspagens',
  escape: 'Escapes',
  queda: 'Quedas',
}

export default function SmartTechChips({ selected, onToggle, modality = 'bjj' }: Props) {
  const [query, setQuery] = useState('')
  const [suggested, setSuggested] = useState<Chip[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [showBrowse, setShowBrowse] = useState(false)

  // 1. Carregar sugestoes (user + gym + explore)
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await (supabase as unknown as {
        rpc: (n: string, p: Record<string, string>) => Promise<{ data: Chip[] | null }>
      }).rpc('suggested_techniques', { p_user_id: user.id, p_modality: modality })
      setSuggested(data ?? [])
      setLoading(false)
    }
    load()
  }, [modality])

  // 2. Busca debounced
  useEffect(() => {
    if (!showBrowse && !query) { setResults([]); return }
    const t = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await (supabase as unknown as {
        rpc: (n: string, p: Record<string, string | number>) => Promise<{ data: SearchResult[] | null }>
      }).rpc('search_techniques', { p_query: query, p_modality: modality, p_limit: 100 })
      setResults(data ?? [])
    }, 200)
    return () => clearTimeout(t)
  }, [query, modality, showBrowse])

  // Agrupar por categoria
  const grouped = useMemo(() => {
    const m = new Map<string, SearchResult[]>()
    for (const r of results) {
      const arr = m.get(r.category) ?? []
      arr.push(r); m.set(r.category, arr)
    }
    return Array.from(m.entries())
  }, [results])

  function handleCustom() {
    const t = query.trim()
    if (!t || selected.includes(t)) return
    onToggle(t)
    setQuery('')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-ink-secondary">
          Posições treinadas
        </span>
        <button type="button"
          onClick={() => setShowBrowse(s => !s)}
          className="text-[11px] text-rise font-black min-h-tap px-2">
          {showBrowse ? '✕ Fechar' : '🔍 Buscar/Explorar'}
        </button>
      </div>

      {/* Chips selecionados */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(t => (
            <button key={t} type="button" onClick={() => onToggle(t)}
              className="flex items-center gap-1 rounded-full text-xs font-bold bg-rise text-ink-primary border border-rise shadow-glow-rise min-h-[36px] px-3 py-1.5">
              {t} <span className="text-[10px] ml-0.5">✕</span>
            </button>
          ))}
        </div>
      )}

      {/* Sugestoes top quando nao tem busca */}
      {!showBrowse && (
        loading ? (
          <p className="text-xs text-ink-muted">Carregando sugestões…</p>
        ) : suggested.length === 0 ? (
          <p className="text-xs text-ink-muted">Toque em &ldquo;Buscar/Explorar&rdquo; para escolher técnicas.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {suggested.filter(c => !selected.includes(c.tag)).slice(0, 12).map(c => (
              <button key={c.tag} type="button" onClick={() => onToggle(c.tag)}
                className="flex items-center gap-1 rounded-full text-xs font-bold bg-brand-elev text-ink-secondary border border-border min-h-[36px] px-3 py-1.5 hover:bg-brand-hover">
                <span className="text-[10px] opacity-60">
                  {c.source === 'user' ? '⭐' : c.source === 'gym' ? '🏢' : '🧭'}
                </span>
                {c.tag}
              </button>
            ))}
          </div>
        )
      )}

      {/* Browse + Search */}
      {showBrowse && (
        <div className="space-y-3 bg-brand-bg/40 rounded-2xl p-3 border border-brand-elev">
          <div className="flex gap-2">
            <input autoFocus
              className="field-input flex-1"
              placeholder="Buscar técnica (ex: triângulo, kimura, de la riva)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCustom() }} />
            {query && !results.some(r => r.name.toLowerCase() === query.toLowerCase()) && (
              <button type="button" onClick={handleCustom}
                className="bg-volt text-brand-bg font-black px-3 rounded-xl text-xs">
                + Custom
              </button>
            )}
          </div>

          {grouped.length === 0 && query && (
            <p className="text-xs text-ink-muted">Nenhuma técnica encontrada. Use &ldquo;+ Custom&rdquo; para adicionar.</p>
          )}

          {grouped.map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-1.5">
                {CATEGORY_LABEL[cat] ?? cat} <span className="text-ink-muted">({items.length})</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {items.map(r => {
                  const isSel = selected.includes(r.name)
                  return (
                    <button key={r.id} type="button" onClick={() => onToggle(r.name)}
                      className={`flex items-center gap-1 rounded-full text-xs font-bold transition-all min-h-[34px] px-3 py-1 ${
                        isSel
                          ? 'bg-rise text-ink-primary border border-rise'
                          : 'bg-brand-surface text-ink-secondary border border-border hover:border-rise/50'
                      }`}>
                      {r.name}
                      {isSel && <span className="text-[10px] ml-0.5">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-[10px] text-ink-muted">
        <span>⭐ Seu</span>
        <span>🏢 Academia</span>
        <span>🧭 Sugerido</span>
      </div>
    </div>
  )
}
