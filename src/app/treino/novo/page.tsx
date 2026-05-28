'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BELTS, getCurriculumByBelt } from '@/lib/curriculum'
import type { BeltId } from '@/lib/supabase/types'

type TrainingType = 'gi' | 'no_gi' | 'drilling' | 'competition' | 'open_mat'

const TYPES: { value: TrainingType; label: string; emoji: string }[] = [
  { value: 'gi',          label: 'Gi',         emoji: '🥋' },
  { value: 'no_gi',       label: 'No-Gi',      emoji: '👕' },
  { value: 'drilling',    label: 'Drilling',   emoji: '🔁' },
  { value: 'competition', label: 'Competição', emoji: '🏆' },
  { value: 'open_mat',    label: 'Open Mat',   emoji: '🤝' },
]

const FEELINGS = [
  { value: 1, emoji: '😫', label: 'Difícil' },
  { value: 2, emoji: '😐', label: 'Cansado' },
  { value: 3, emoji: '🙂', label: 'OK' },
  { value: 4, emoji: '💪', label: 'Forte' },
  { value: 5, emoji: '🔥', label: 'Voando' },
]

export default function NovoTreinoPage() {
  const router = useRouter()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerStart, setTimerStart] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0) // seconds

  // Form state
  const [type, setType] = useState<TrainingType>('gi')
  const [duration, setDuration] = useState<number | ''>('') // minutes, manual entry
  const [instructor, setInstructor] = useState('')
  const [techniques, setTechniques] = useState<string[]>([])
  const [rolls, setRolls] = useState(0)
  const [subsFor, setSubsFor] = useState(0)
  const [subsAgainst, setSubsAgainst] = useState(0)
  const [feeling, setFeeling] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [techSearch, setTechSearch] = useState('')
  const [showTechPicker, setShowTechPicker] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<{ belt_id: string; academy_name: string | null } | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles')
        .select('belt_id, academy_name').eq('id', user.id).single()
      setProfile(data as { belt_id: string; academy_name: string | null } | null)
    }
    load()
  }, [router])

  // Timer effect
  useEffect(() => {
    if (timerRunning && timerStart) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - timerStart) / 1000))
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerRunning, timerStart])

  function startTimer() {
    setTimerStart(Date.now() - elapsed * 1000)
    setTimerRunning(true)
  }
  function pauseTimer() { setTimerRunning(false) }
  function stopTimer() {
    setTimerRunning(false)
    const mins = Math.max(1, Math.round(elapsed / 60))
    setDuration(mins)
  }
  function resetTimer() {
    setTimerRunning(false)
    setTimerStart(null)
    setElapsed(0)
  }

  // Curriculum techniques list (current belt and lower)
  const curriculum = profile ? getCurriculumByBelt(profile.belt_id as BeltId) : null
  const allTechs = curriculum
    ? curriculum.modules.flatMap(m => m.categories.flatMap(c => c.techniques.map(t => t.name)))
    : []
  const filteredTechs = allTechs.filter(t =>
    !techSearch || t.toLowerCase().includes(techSearch.toLowerCase())
  ).slice(0, 30)

  function toggleTech(t: string) {
    setTechniques(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  async function save() {
    if (!duration || duration < 1) { setError('Informe a duração do treino'); return }
    setSaving(true); setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Get academy_id if user is member
    const { data: mem } = await supabase.from('academy_members')
      .select('academy_id').eq('user_id', user.id).eq('active', true).maybeSingle()
    const academyId = (mem as { academy_id: string } | null)?.academy_id ?? null

    const { error: err } = await (supabase.from('training_sessions') as ReturnType<typeof supabase.from>)
      .insert({
        user_id:      user.id,
        academy_id:   academyId,
        type,
        duration_min: duration,
        instructor:   instructor || null,
        techniques,
        rolls,
        subs_for:     subsFor,
        subs_against: subsAgainst,
        feeling,
        note:         note || null,
      } as never)

    setSaving(false)
    if (err) { setError(err.message); return }
    router.push('/dashboard?treino=ok')
    router.refresh()
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/dashboard" className="text-[#555] text-sm">← Cancelar</Link>
        <h1 className="font-black text-base tracking-tight">Novo Treino</h1>
        <button onClick={save} disabled={saving || !duration}
          className="text-[#CC0000] font-black text-sm disabled:opacity-30">
          {saving ? '...' : 'Salvar'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 space-y-4 pb-32">

        {/* TIMER hero */}
        <div className="rounded-2xl p-5 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #CC0000 0%, #E52222 100%)' }}>
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
          <div className="relative z-10 text-center">
            <p className="text-white/70 text-[10px] font-black uppercase tracking-wider mb-2">
              {timerRunning ? '⏱ Treino em andamento' : elapsed > 0 ? 'Pausado' : 'Cronômetro'}
            </p>
            <p className="font-black text-6xl tabular-nums tracking-tight leading-none">{mm}:{ss}</p>
            <div className="flex gap-2 justify-center mt-4">
              {!timerRunning && elapsed === 0 && (
                <button onClick={startTimer}
                  className="bg-white text-[#CC0000] font-black px-6 py-2.5 rounded-full text-sm shadow">
                  ▶ Iniciar
                </button>
              )}
              {timerRunning && (
                <button onClick={pauseTimer}
                  className="bg-white text-[#CC0000] font-black px-6 py-2.5 rounded-full text-sm shadow">
                  ⏸ Pausar
                </button>
              )}
              {!timerRunning && elapsed > 0 && (
                <>
                  <button onClick={startTimer}
                    className="bg-white text-[#CC0000] font-black px-5 py-2.5 rounded-full text-sm shadow">
                    ▶ Continuar
                  </button>
                  <button onClick={stopTimer}
                    className="bg-black/30 backdrop-blur text-white font-black px-5 py-2.5 rounded-full text-sm">
                    ✓ Finalizar
                  </button>
                  <button onClick={resetTimer}
                    className="bg-black/30 backdrop-blur text-white font-black px-3 py-2.5 rounded-full text-sm">
                    ↻
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="field-label">Duração (minutos)</label>
          <input
            type="number"
            className="field-input"
            placeholder="Ex: 90"
            min={1} max={600}
            value={duration}
            onChange={e => setDuration(e.target.value ? parseInt(e.target.value) : '')}
          />
        </div>

        {/* Type */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="field-label mb-3">Tipo de treino</p>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setType(t.value)}
                className={`py-3 px-2 rounded-xl border-2 text-center transition-all ${
                  type === t.value
                    ? 'border-[#CC0000] bg-[#FFF0F0]'
                    : 'border-[#E5E5E5] bg-white'
                }`}>
                <div className="text-xl mb-1">{t.emoji}</div>
                <p className={`text-xs font-black ${type === t.value ? 'text-[#CC0000]' : 'text-[#555]'}`}>{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Instructor + academy */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="field-label">Academia</label>
            <p className="text-sm text-[#555] py-2.5 px-3 bg-[#F2F0ED] rounded-xl">
              {profile?.academy_name ?? '— não definida (edite no perfil)'}
            </p>
          </div>
          <div>
            <label className="field-label">Professor (opcional)</label>
            <input className="field-input"
              placeholder="Ex: Professor Ricardo"
              value={instructor}
              onChange={e => setInstructor(e.target.value)} />
          </div>
        </div>

        {/* Counters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="field-label mb-3">Performance</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Rolas',         value: rolls,        setter: setRolls,        color: '#CC0000' },
              { label: 'Finalizei',     value: subsFor,      setter: setSubsFor,      color: '#16A34A' },
              { label: 'Fui finalizado', value: subsAgainst, setter: setSubsAgainst, color: '#F59E0B' },
            ].map(c => (
              <div key={c.label} className="bg-[#F8F7F5] rounded-xl p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#888] mb-2">{c.label}</p>
                <p className="font-black text-2xl mb-2" style={{ color: c.color }}>{c.value}</p>
                <div className="flex gap-1.5 justify-center">
                  <button onClick={() => c.setter(Math.max(0, c.value - 1))}
                    className="w-7 h-7 rounded-full bg-white border border-[#E5E5E5] text-[#555] font-black">−</button>
                  <button onClick={() => c.setter(c.value + 1)}
                    className="w-7 h-7 rounded-full text-white font-black"
                    style={{ background: c.color }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Techniques */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="field-label mb-0">Técnicas treinadas</p>
            <button onClick={() => setShowTechPicker(s => !s)}
              className="text-xs text-[#CC0000] font-black">
              {showTechPicker ? 'Fechar' : '+ Adicionar'}
            </button>
          </div>

          {techniques.length === 0 && !showTechPicker && (
            <p className="text-xs text-[#AAA]">Nenhuma técnica selecionada</p>
          )}

          {techniques.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {techniques.map(t => (
                <button key={t} onClick={() => toggleTech(t)}
                  className="bg-[#FFF0F0] border border-[#FFCCCC] text-[#CC0000] rounded-full px-2.5 py-1 text-xs font-bold">
                  {t} ✕
                </button>
              ))}
            </div>
          )}

          {showTechPicker && (
            <div className="mt-2">
              <input
                className="field-input mb-2"
                placeholder="Buscar técnica..."
                value={techSearch}
                onChange={e => setTechSearch(e.target.value)} />
              <div className="max-h-60 overflow-y-auto scrollbar-none space-y-1">
                {filteredTechs.map(t => (
                  <button key={t} onClick={() => toggleTech(t)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      techniques.includes(t)
                        ? 'bg-[#FFF0F0] text-[#CC0000]'
                        : 'bg-[#F8F7F5] text-[#555]'
                    }`}>
                    {techniques.includes(t) ? '✓ ' : ''}{t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feeling */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="field-label mb-3">Como foi o treino?</p>
          <div className="grid grid-cols-5 gap-1.5">
            {FEELINGS.map(f => (
              <button key={f.value} onClick={() => setFeeling(f.value)}
                className={`py-3 rounded-xl border-2 transition-all ${
                  feeling === f.value
                    ? 'border-[#CC0000] bg-[#FFF0F0] scale-105'
                    : 'border-[#E5E5E5] bg-white'
                }`}>
                <div className="text-xl">{f.emoji}</div>
                <p className={`text-[9px] font-black mt-0.5 ${feeling === f.value ? 'text-[#CC0000]' : 'text-[#888]'}`}>
                  {f.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="field-label">Anotações</label>
          <textarea
            className="field-input"
            rows={3}
            placeholder="O que aprendeu hoje? Pontos a melhorar..."
            value={note}
            onChange={e => setNote(e.target.value)} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 font-bold text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Bottom CTA fixo */}
      <div className="bg-white border-t border-[#E5E5E5] px-4 py-3 sticky bottom-0">
        <button onClick={save} disabled={saving || !duration}
          className="btn-primary disabled:opacity-40">
          {saving ? 'Salvando...' : '🥋 Salvar treino'}
        </button>
      </div>
    </div>
  )
}
