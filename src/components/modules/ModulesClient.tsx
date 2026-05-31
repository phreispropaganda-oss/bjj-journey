'use client'

import { useState, useEffect, useCallback } from 'react'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import Link from 'next/link'
import { getCurriculumByBelt, BELTS } from '@/lib/curriculum'
import { useProgressStore } from '@/store/progress'
import { useUserStore } from '@/store/user'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/ui/BottomNav'
import type { BeltId } from '@/lib/supabase/types'
import type { Technique } from '@/lib/curriculum'

interface Props { beltId: string }

// Inline timer component (3/5/10 min)
function InlineTimer({ minutes, color, onClose }: { minutes: number; color: string; onClose: () => void }) {
  const [secs, setSecs] = useState(minutes * 60)
  const [running, setRunning] = useState(true)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSecs(s => s <= 1 ? (clearInterval(id), 0) : s - 1), 1000)
    return () => clearInterval(id)
  }, [running])
  useEffect(() => {
    if (secs === 0 && 'vibrate' in navigator) navigator.vibrate?.([200, 100, 200])
  }, [secs])
  const m = Math.floor(secs / 60), s = secs % 60
  return (
    <div className="fixed inset-0 bg-black/85 z-[60] flex flex-col items-center justify-center gap-5 px-6"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <p className="text-white text-sm font-black uppercase tracking-wider">Cronômetro {minutes}min</p>
      <div className="w-56 h-56 rounded-full border-4 flex flex-col items-center justify-center"
        style={{ borderColor: color }}>
        <span className="text-6xl font-black tabular-nums" style={{ color: secs === 0 ? '#FFCCCC' : color }}>
          {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
        </span>
        <span className="text-xs text-white/60 mt-1">{secs === 0 ? 'TEMPO!' : 'restante'}</span>
      </div>
      <div className="flex gap-3">
        <button onClick={() => setRunning(r => !r)}
          className="px-5 py-3 rounded-full bg-white/10 text-white text-sm font-black min-h-tap">
          {running ? '⏸ Pausar' : '▶ Retomar'}
        </button>
        <button onClick={() => { setRunning(false); setSecs(minutes * 60) }}
          className="px-5 py-3 rounded-full bg-white/10 text-white text-sm font-black min-h-tap">
          ↺ Reset
        </button>
        <button onClick={onClose}
          className="px-5 py-3 rounded-full bg-rise text-white text-sm font-black min-h-tap">
          Fechar
        </button>
      </div>
    </div>
  )
}

// ── Technique Detail Sheet ──
function TechDetail({ tech, color, onClose, onToggle, done }: {
  tech: Technique; color: string; onClose: () => void; onToggle: () => void; done: boolean
}) {
  const [timerMin, setTimerMin] = useState<number | null>(null)
  useBodyScrollLock(true)
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-brand-surface w-full max-w-[480px] rounded-t-3xl max-h-[85vh] flex flex-col"
        style={{ animation: 'slideUp .25s ease' }}>
        {/* Handle */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
          <div className="w-8 h-1 bg-brand-elev rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <h3 className="font-black text-base text-ink-primary mt-1 flex-1">{tech.name}</h3>
          <button onClick={onClose} className="text-ink-muted text-xl ml-2">✕</button>
        </div>

        <div className="overflow-y-auto scrollbar-none flex-1 px-5 pb-6">
          {/* Entry position */}
          <div className="bg-brand-bg rounded-xl p-3 mb-3 border-l-2" style={{ borderColor: color }}>
            <span className="text-[10px] font-black uppercase tracking-wider text-ink-muted block mb-1">Posição de entrada</span>
            <p className="text-sm text-ink-secondary leading-relaxed">{tech.entryPosition}</p>
          </div>

          {/* Description */}
          <p className="text-sm text-ink-secondary leading-relaxed mb-3">{tech.description}</p>

          {/* Steps */}
          <div className="space-y-2 mb-3">
            {tech.steps.map((s, i) => (
              <div key={i} className="flex gap-2.5 text-sm">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 text-white"
                  style={{ background: color }}>
                  {i + 1}
                </div>
                <span className="text-ink-primary leading-relaxed">{s}</span>
              </div>
            ))}
          </div>

          {/* Mistake */}
          <div className="flex gap-2 bg-blood/10 border border-blood/30 rounded-xl p-2.5 mb-2 text-xs text-ink-secondary leading-relaxed">
            <span className="text-blood flex-shrink-0 mt-0.5">⚠️</span>
            <span>{tech.commonMistake}</span>
          </div>

          {/* Tip */}
          <div className="flex gap-2 bg-volt/10 border border-volt/30 rounded-xl p-2.5 mb-4 text-xs text-ink-secondary leading-relaxed">
            <span className="text-volt-deep flex-shrink-0 mt-0.5">💡</span>
            <span>{tech.tip}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {[3, 5, 10].map(m => (
              <button key={m} type="button"
                onClick={() => setTimerMin(m)}
                className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-brand-elev bg-brand-elev/40 text-ink-primary font-bold hover:border-rise hover:text-rise transition-colors min-h-tap">
                ⏱ {m}min
              </button>
            ))}
            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(tech.youtubeQuery)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-brand-elev bg-brand-elev/40 text-ink-primary font-bold hover:border-rise hover:text-rise transition-colors min-h-tap">
              ▶ YouTube
            </a>
          </div>
        </div>

        {timerMin !== null && (
          <InlineTimer minutes={timerMin} color={color} onClose={() => setTimerMin(null)} />
        )}

        {/* Mark done — STICKY no rodape, safe-area-aware */}
        <div className="px-5 pt-3 border-t border-brand-elev flex-shrink-0 bg-brand-surface"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}>
          <button onClick={onToggle}
            className={`w-full py-4 rounded-full font-black text-base transition-all min-h-[56px] ${
              done
                ? 'bg-volt/15 border-2 border-volt/40 text-volt-deep'
                : 'bg-rise text-white shadow-lg shadow-red-900/20 active:bg-rise-deep'
            }`}>
            {done ? '✓ Técnica concluída — desfazer' : 'Marcar como feita →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ModulesClient({ beltId }: Props) {
  const curriculum = getCurriculumByBelt(beltId as BeltId)
  const { isCompleted, toggle, getCount, setCompletedForBelt } = useProgressStore()
  const { addXP } = useUserStore()
  const [openMods, setOpenMods] = useState<Record<string, boolean>>({})
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<{ tech: Technique; color: string; key: string; moduleId: string } | null>(null)
  const [tdah, setTdah] = useState(false)
  const [xpShow, setXpShow] = useState(false)
  const belt = BELTS.find(b => b.id === beltId) ?? BELTS[0]

  // Sync from Supabase on mount
  const syncFromSupabase = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('technique_completions')
      .select('belt_id, module_id, technique_name')
      .eq('user_id', user.id)
      .eq('belt_id', beltId)
    const rows = (data ?? []) as { belt_id: string; module_id: string; technique_name: string }[]
    setCompletedForBelt(beltId, rows.map(c => `${c.belt_id}-${c.module_id}-${c.technique_name.replace(/\s/g, '_')}`))
  }, [beltId, setCompletedForBelt])

  useEffect(() => { syncFromSupabase() }, [syncFromSupabase])

  if (!curriculum || !belt) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <p className="text-ink-muted">Faixa não encontrada.</p>
    </div>
  )

  async function handleComplete(bId: string, modId: string, techName: string) {
    const key = `${bId}-${modId}-${techName.replace(/\s/g, '_')}`
    const wasDone = isCompleted(key)
    toggle(key)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (!wasDone) {
      addXP(10)
      setXpShow(true)
      setTimeout(() => setXpShow(false), 2200)
      await (supabase.from('technique_completions') as ReturnType<typeof supabase.from>).insert({
        user_id: user.id, belt_id: bId, module_id: modId, technique_name: techName,
      } as never)
      await (supabase as unknown as { rpc: (n: string, p: Record<string, string | number>) => Promise<unknown> })
        .rpc('increment_xp', { user_id: user.id, amount: 10 })
    } else {
      await supabase.from('technique_completions' as never)
        .delete().match({ user_id: user.id, belt_id: bId, module_id: modId, technique_name: techName } as never)
    }
  }

  const totalTechs = curriculum.modules.reduce((a, m) =>
    a + m.categories.reduce((b, c) => b + c.techniques.length, 0), 0)
  const doneTechs  = curriculum.modules.reduce((a, m) =>
    a + m.categories.reduce((b, c) =>
      b + c.techniques.filter(t => isCompleted(`${beltId}-${m.id}-${t.name.replace(/\s/g, '_')}`)).length, 0), 0)
  const beltPct = totalTechs > 0 ? Math.round((doneTechs / totalTechs) * 100) : 0

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* XP toast */}
      {xpShow && (
        <div className="fixed top-16 right-4 z-50 bg-brand-surface border border-volt rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg"
          style={{ animation: 'fadeUp .25s ease' }}>
          <span className="text-yellow-500 text-lg">⚡</span>
          <span className="text-sm font-black text-ink-primary">+10 XP</span>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[11px] text-ink-muted font-bold uppercase tracking-wider">Módulos</p>
            <h1 className="text-lg font-black tracking-tight">Faixa {belt.name}</h1>
          </div>
          <button onClick={() => setTdah(t => !t)}
            title={tdah ? 'Sair do modo Foco' : 'Modo Foco: mostra so o proximo modulo pendente'}
            className={`px-3 py-2 rounded-full text-xs font-black border-2 transition-all min-h-tap ${
              tdah
                ? 'bg-rise border-rise text-white shadow-lg'
                : 'border-brand-elev text-ink-secondary bg-brand-surface'
            }`}>
            🧠 {tdah ? 'Foco ON' : 'Foco'}
          </button>
        </div>
        {/* Belt progress bar */}
        <div className="h-1.5 bg-brand-elev rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${beltPct}%`, background: belt.color }} />
        </div>
        <p className="text-[11px] text-ink-muted mt-1">{doneTechs}/{totalTechs} técnicas · {beltPct}%</p>
      </div>

      {/* Belt selector */}
      <div className="bg-brand-surface border-b border-brand-elev px-3 py-2 flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
        {BELTS.map(b => (
          <Link key={b.id} href={`/modules/${b.id}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 flex-shrink-0 text-xs font-black transition-all ${
              b.id === beltId
                ? 'text-white border-transparent shadow-sm'
                : 'bg-brand-surface border-brand-elev text-ink-secondary'
            }`}
            style={b.id === beltId ? { background: belt.color, borderColor: belt.color } : {}}>
            <div className="w-3 h-2 rounded-sm border border-black/10" style={{ background: b.color }} />
            {b.name}
          </Link>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pt-3 pb-24">
        {(() => {
          // Modo Foco: apenas o primeiro modulo com pendentes, ja expandido
          if (tdah) {
            const firstPending = curriculum.modules.find(m =>
              m.categories.some(c => c.techniques.some(t =>
                !isCompleted(`${beltId}-${m.id}-${t.name.replace(/\s/g, '_')}`)
              ))
            )
            return firstPending ? [firstPending] : []
          }
          return curriculum.modules
        })().map(mod => {
          const modTotal = mod.categories.reduce((a, c) => a + c.techniques.length, 0)
          const modDone  = getCount(beltId, mod.id)
          const modPct   = modTotal > 0 ? Math.round((modDone / modTotal) * 100) : 0
          const isOpen   = tdah ? true : openMods[mod.id]

          return (
            <div key={mod.id} className="bg-brand-surface rounded-2xl mb-2.5 overflow-hidden border border-brand-elev">
              {/* Module header */}
              <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-brand-bg"
                onClick={() => setOpenMods(o => ({ ...o, [mod.id]: !o[mod.id] }))}>
                <span className="text-2xl font-black min-w-[32px] leading-none"
                  style={{ color: mod.color }}>{mod.number}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-ink-primary">{mod.label}</p>
                  <p className="text-[11px] text-ink-muted truncate">{mod.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-black" style={{ color: mod.color }}>{modPct}%</span>
                  <span className={`text-ink-muted text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-0.5 bg-brand-elev">
                <div className="h-full transition-all" style={{ width: `${modPct}%`, background: mod.color }} />
              </div>

              {/* Categories */}
              {isOpen && (
                <div className="border-t border-brand-elev">
                  {mod.categories.map(cat => {
                    const catOpen = openCats[cat.id]
                    const catDone = cat.techniques.filter(t =>
                      isCompleted(`${beltId}-${mod.id}-${t.name.replace(/\s/g, '_')}`)
                    ).length
                    const catPct = cat.techniques.length > 0
                      ? Math.round((catDone / cat.techniques.length) * 100) : 0

                    return (
                      <div key={cat.id} className="border-t border-brand-elev">
                        <div
                          className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer active:bg-brand-bg"
                          onClick={() => setOpenCats(o => ({ ...o, [cat.id]: !o[cat.id] }))}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: cat.bgColor }}>
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                          </div>
                          <span className="flex-1 text-sm font-bold text-ink-primary">{cat.name}</span>
                          <span className="text-xs text-ink-muted">{catDone}/{cat.techniques.length}</span>
                          <span className="text-xs font-black" style={{ color: cat.color }}>{catPct}%</span>
                          <span className={`text-ink-muted text-sm transition-transform ${catOpen ? 'rotate-180' : ''}`}>▾</span>
                        </div>

                        {catOpen && (
                          <div className="bg-brand-bg">
                            {cat.techniques.map((tech, i) => {
                              const key = `${beltId}-${mod.id}-${tech.name.replace(/\s/g, '_')}`
                              const isDone = isCompleted(key)
                              return (
                                <div key={tech.name}
                                  className={`border-t border-brand-elev ${isDone ? 'opacity-60' : ''}`}>
                                  <div
                                    className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer active:bg-brand-surface"
                                    onClick={() => setSelected({ tech, color: mod.color, key, moduleId: mod.id })}>
                                    <span className="text-[11px] text-ink-muted min-w-[18px] tabular-nums">{i + 1}</span>
                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: mod.color }} />
                                    <span className="flex-1 text-sm font-medium text-ink-primary">{tech.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                      isDone ? 'bg-volt/20 text-volt-deep' : 'bg-brand-elev text-ink-muted'
                                    }`}>
                                      {isDone ? '✓ feito' : 'pendente'}
                                    </span>
                                    <span className="text-ink-muted text-xs">›</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Technique detail sheet */}
      {selected && (
        <TechDetail
          tech={selected.tech}
          color={selected.color}
          done={isCompleted(selected.key)}
          onClose={() => setSelected(null)}
          onToggle={() => {
            handleComplete(beltId, selected.moduleId, selected.tech.name)
          }}
        />
      )}

      <BottomNav active="modules" />
    </div>
  )
}
