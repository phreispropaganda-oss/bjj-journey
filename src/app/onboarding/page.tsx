'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BELTS } from '@/lib/curriculum'
import type { BeltId } from '@/lib/supabase/types'

const TOTAL_STEPS = 6

const GOALS = [
  'Quedas', 'Guarda Fechada', 'Meia Guarda', 'Borboleta',
  '100 Quilos', 'Guarda Aranha', 'Costas', 'Montada',
  'Finaliz. de braço', 'Estrangulamentos', 'Raspagens',
  'Passagens', 'Regras', 'Competição',
]

const ACADEMIES = [
  { id: 'gb', name: 'Gracie Barra' },
  { id: 'alliance', name: 'Alliance' },
  { id: 'atos', name: 'Atos' },
  { id: 'checkmat', name: 'Checkmat' },
  { id: 'gfteam', name: 'GFTeam' },
  { id: 'nova', name: 'Nova União' },
  { id: 'zenith', name: 'Zenith' },
  { id: 'ns', name: 'NS Brotherhood' },
]

const PRACTICE_TIMES = [
  { value: 'menos6', label: 'Menos de 6 meses' },
  { value: '6a12', label: '6 meses a 1 ano' },
  { value: '1a2', label: '1 a 2 anos' },
  { value: '2a4', label: '2 a 4 anos' },
  { value: '4a7', label: '4 a 7 anos' },
  { value: '7a10', label: '7 a 10 anos' },
  { value: 'mais10', label: 'Mais de 10 anos' },
]

const FREQUENCIES = [
  { value: '1', label: '1× por semana' },
  { value: '2', label: '2× por semana' },
  { value: '3', label: '3× por semana' },
  { value: '4', label: '4× por semana' },
  { value: '5+', label: '5× ou mais' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  // Step 2
  const [beltId, setBeltId] = useState<BeltId>('white')
  // Step 3
  const [degrees, setDegrees] = useState(0)
  // Step 4
  const [practiceTime, setPracticeTime] = useState('')
  const [frequency, setFrequency] = useState('')
  // Step 5
  const [academy, setAcademy] = useState('')
  const [academyCustom, setAcademyCustom] = useState('')
  // Step 6
  const [goals, setGoals] = useState<string[]>([])

  useEffect(() => {
    // Guard: already onboarded → dashboard
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      const profile = data as { name: string } | null
      if (profile?.name) router.push('/dashboard')
    }
    check()
  }, [router])

  const belt = BELTS.find(b => b.id === beltId) ?? BELTS[0]

  function toggleGoal(g: string) {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  function canAdvance(): boolean {
    if (step === 1) return name.trim().length >= 2
    if (step === 4) return !!practiceTime && !!frequency
    return true
  }

  function next() {
    if (!canAdvance()) return
    if (step < TOTAL_STEPS) setStep(s => s + 1)
    else finish()
  }

  async function finish() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const finalAcademy = academyCustom || academy
    const username = (user.email?.split('@')[0] ?? 'atleta')
      .toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'atleta'

    const { error: err } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
      .update({
        name: name.trim(),
        belt_id: beltId,
        degrees,
        academy_name: finalAcademy || null,
        username,
      } as never)
      .eq('id', user.id)

    if (err) { setError(err.message); setSaving(false); return }
    router.push('/dashboard')
  }

  const progress = ((step - 1) / TOTAL_STEPS) * 100

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col">
      {/* Top progress bar */}
      <div className="bg-white border-b border-[#E5E5E5] px-5 py-4 flex items-center gap-4">
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/login')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F0ED] text-[#555] text-lg"
        >
          ←
        </button>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-[#555] uppercase tracking-wider">Etapa {step} de {TOTAL_STEPS}</span>
          </div>
          <div className="h-1.5 bg-[#F2F0ED] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#CC0000] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* ── STEP 1: Nome + Idade ── */}
        {step === 1 && (
          <div style={{ animation: 'fadeUp .25s ease' }}>
            <div className="w-12 h-12 bg-[#FFF0F0] rounded-2xl flex items-center justify-center mb-4 text-2xl">👤</div>
            <h1 className="text-2xl font-black text-[#0D0D0D] mb-1 tracking-tight">Olá! Vamos começar</h1>
            <p className="text-sm text-[#666] mb-6 leading-relaxed">Conta um pouco sobre você para personalizar sua jornada.</p>
            <div className="mb-4">
              <label className="field-label">Seu nome</label>
              <input
                className="field-input"
                placeholder="Ex: João Silva"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mb-6">
              <label className="field-label">Sua idade <span className="text-[#BBB] font-normal normal-case">(opcional)</span></label>
              <input
                type="number"
                className="field-input"
                placeholder="Ex: 28"
                min={5} max={80}
                value={age}
                onChange={e => setAge(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: Faixa ── */}
        {step === 2 && (
          <div style={{ animation: 'fadeUp .25s ease' }}>
            <div className="w-12 h-12 bg-[#FFF0F0] rounded-2xl flex items-center justify-center mb-4 text-2xl">🥋</div>
            <h1 className="text-2xl font-black text-[#0D0D0D] mb-1 tracking-tight">Sua faixa atual</h1>
            <p className="text-sm text-[#666] mb-6 leading-relaxed">Selecione a faixa que você possui hoje.</p>
            <div className="space-y-2 mb-6">
              {BELTS.map(b => (
                <div
                  key={b.id}
                  onClick={() => setBeltId(b.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    beltId === b.id
                      ? 'border-[#CC0000] bg-[#FFF0F0]'
                      : 'border-[#E5E5E5] bg-white'
                  }`}
                >
                  <div className="w-10 h-6 rounded-md flex-shrink-0 border border-black/10" style={{ background: b.color }} />
                  <div className="flex-1">
                    <p className="font-bold text-sm">Faixa {b.name}</p>
                    <p className="text-xs text-[#888]">{b.desc}</p>
                  </div>
                  {beltId === b.id && <span className="text-[#CC0000] font-black">✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Graus ── */}
        {step === 3 && (
          <div style={{ animation: 'fadeUp .25s ease' }}>
            <div className="w-12 h-12 bg-[#FFF0F0] rounded-2xl flex items-center justify-center mb-4 text-2xl">🏅</div>
            <h1 className="text-2xl font-black text-[#0D0D0D] mb-1 tracking-tight">Quantos graus?</h1>
            <p className="text-sm text-[#666] mb-2 leading-relaxed">Graus na faixa <strong>{belt.name}</strong> (0 = sem grau).</p>
            {/* Belt preview */}
            <div className="flex items-center gap-2 bg-white rounded-2xl p-3 mb-6 border border-[#E5E5E5]">
              <div className="flex-1 h-5 rounded flex items-center overflow-hidden" style={{ background: belt.color }}>
                <div className="flex-1" />
                {Array.from({ length: degrees }).map((_, i) => (
                  <div key={i} className="w-2 h-[65%] bg-white/70 rounded-sm mr-0.5" />
                ))}
                <div className="w-4 h-full bg-black/80" />
              </div>
              <span className="text-sm font-bold text-[#555]">Faixa {belt.name}, {degrees}° grau</span>
            </div>
            <div className="flex gap-2.5 flex-wrap mb-6">
              {Array.from({ length: belt.maxDeg + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setDegrees(i)}
                  className={`w-12 h-12 rounded-full border-2 font-black text-base transition-all ${
                    degrees === i
                      ? 'bg-[#CC0000] border-[#CC0000] text-white shadow-lg shadow-red-900/30'
                      : 'bg-white border-[#E5E5E5] text-[#0D0D0D]'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Histórico ── */}
        {step === 4 && (
          <div style={{ animation: 'fadeUp .25s ease' }}>
            <div className="w-12 h-12 bg-[#FFF0F0] rounded-2xl flex items-center justify-center mb-4 text-2xl">📊</div>
            <h1 className="text-2xl font-black text-[#0D0D0D] mb-1 tracking-tight">Seu histórico</h1>
            <p className="text-sm text-[#666] mb-6 leading-relaxed">Há quanto tempo você pratica e com que frequência treina?</p>
            <div className="mb-4">
              <label className="field-label">Tempo de prática</label>
              <div className="space-y-2">
                {PRACTICE_TIMES.map(p => (
                  <div
                    key={p.value}
                    onClick={() => setPracticeTime(p.value)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      practiceTime === p.value
                        ? 'border-[#CC0000] bg-[#FFF0F0]'
                        : 'border-[#E5E5E5] bg-white'
                    }`}
                  >
                    <span className="text-sm font-medium">{p.label}</span>
                    {practiceTime === p.value && <span className="text-[#CC0000] font-black">✓</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="field-label">Frequência semanal</label>
              <div className="grid grid-cols-2 gap-2">
                {FREQUENCIES.map(f => (
                  <div
                    key={f.value}
                    onClick={() => setFrequency(f.value)}
                    className={`flex items-center justify-center px-3 py-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold ${
                      frequency === f.value
                        ? 'border-[#CC0000] bg-[#CC0000] text-white'
                        : 'border-[#E5E5E5] bg-white text-[#555]'
                    }`}
                  >
                    {f.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: Academia ── */}
        {step === 5 && (
          <div style={{ animation: 'fadeUp .25s ease' }}>
            <div className="w-12 h-12 bg-[#FFF0F0] rounded-2xl flex items-center justify-center mb-4 text-2xl">🏢</div>
            <h1 className="text-2xl font-black text-[#0D0D0D] mb-1 tracking-tight">Sua academia</h1>
            <p className="text-sm text-[#666] mb-6 leading-relaxed">Selecione ou escreva o nome da sua academia.</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {ACADEMIES.map(a => (
                <div
                  key={a.id}
                  onClick={() => { setAcademy(a.name); setAcademyCustom('') }}
                  className={`py-3 px-3 rounded-xl border-2 cursor-pointer transition-all text-center text-sm font-bold ${
                    academy === a.name && !academyCustom
                      ? 'border-[#CC0000] bg-[#FFF0F0] text-[#CC0000]'
                      : 'border-[#E5E5E5] bg-white text-[#555]'
                  }`}
                >
                  {a.name}
                </div>
              ))}
            </div>
            <div className="mb-6">
              <label className="field-label">Outra academia <span className="text-[#BBB] font-normal normal-case">(opcional)</span></label>
              <input
                className="field-input"
                placeholder="Nome da academia..."
                value={academyCustom}
                onChange={e => { setAcademyCustom(e.target.value); setAcademy('') }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 6: Objetivos ── */}
        {step === 6 && (
          <div style={{ animation: 'fadeUp .25s ease' }}>
            <div className="w-12 h-12 bg-[#FFF0F0] rounded-2xl flex items-center justify-center mb-4 text-2xl">🎯</div>
            <h1 className="text-2xl font-black text-[#0D0D0D] mb-1 tracking-tight">O que quer melhorar?</h1>
            <p className="text-sm text-[#666] mb-6 leading-relaxed">Selecione as áreas que quer priorizar (múltipla escolha).</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {GOALS.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGoal(g)}
                  className={`px-3.5 py-2 rounded-full border-2 text-sm font-bold transition-all ${
                    goals.includes(g)
                      ? 'border-[#CC0000] bg-[#CC0000] text-white'
                      : 'border-[#E5E5E5] bg-white text-[#555]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4 text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-white border-t border-[#E5E5E5] px-5 py-4">
        <button
          onClick={next}
          disabled={!canAdvance() || saving}
          className="btn-primary disabled:opacity-40"
        >
          {saving
            ? 'Salvando...'
            : step === TOTAL_STEPS
              ? '🥋 Começar minha jornada'
              : `Continuar →`}
        </button>
        {step === TOTAL_STEPS && (
          <button
            onClick={finish}
            disabled={saving}
            className="w-full text-center text-sm text-[#AAA] mt-3 font-medium"
          >
            Pular e completar depois
          </button>
        )}
      </div>
    </div>
  )
}
