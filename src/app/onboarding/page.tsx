'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BELTS } from '@/lib/curriculum'
import type { BeltId } from '@/lib/supabase/types'

const STEPS = 3

export default function OnboardingPage() {
  const router = useRouter()

  // Guard: redirect already-onboarded users to dashboard
  useEffect(() => {
    async function checkProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      const profileData = data as { name: string } | null
      if (profileData?.name) router.push('/dashboard')
    }
    checkProfile()
  }, [router])
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [beltId, setBeltId] = useState<BeltId>('white')
  const [degrees, setDegrees] = useState(0)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function finish() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const uname = username || (user.email?.split('@')[0] ?? 'atleta')
    const { error: err } = await supabase
      .from('profiles')
      .update({ name, belt_id: beltId, degrees, username: uname } as never)
      .eq('id', user.id)

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  const belt = BELTS.find(b => b.id === beltId) ?? BELTS[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5EE] to-[#F7F4F0] px-5 py-10">
      <div className="max-w-sm mx-auto">
        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: STEPS }).map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i < step ? 'bg-[#FF6B2B]' : 'bg-[#E8E3DC]'}`} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <div className="w-12 h-12 rounded-full bg-[#FFF0E8] flex items-center justify-center mb-4 text-2xl">🙋</div>
            <h1 className="text-2xl font-bold mb-1">Olá! Vamos começar</h1>
            <p className="text-sm text-[#666] mb-6">Conte um pouco sobre você para personalizar sua jornada.</p>
            <label className="field-label">Seu nome</label>
            <input className="field-input mb-4" placeholder="Ex: João Silva" value={name} onChange={e => setName(e.target.value)} />
            <label className="field-label">Seu @username</label>
            <input className="field-input mb-6" placeholder="joaosilva" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} />
            <button className="btn-primary" disabled={!name} onClick={() => setStep(2)}>Continuar →</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="w-12 h-12 rounded-full bg-[#FFF0E8] flex items-center justify-center mb-4 text-2xl">🥋</div>
            <h1 className="text-2xl font-bold mb-1">Sua faixa atual</h1>
            <p className="text-sm text-[#666] mb-5">Selecione a faixa que você possui hoje.</p>
            <div className="space-y-2 mb-5">
              {BELTS.map(b => (
                <div key={b.id} onClick={() => setBeltId(b.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${beltId === b.id ? 'border-[#FF6B2B] bg-[#FFF0E8]' : 'border-[#E8E3DC] bg-white'}`}>
                  <div className="w-8 h-5 rounded" style={{ background: b.color }} />
                  <div>
                    <p className="font-semibold text-sm">Faixa {b.name}</p>
                    <p className="text-xs text-[#666]">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setStep(3)}>Continuar →</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="w-12 h-12 rounded-full bg-[#FFF0E8] flex items-center justify-center mb-4 text-2xl">🏅</div>
            <h1 className="text-2xl font-bold mb-1">Quantos graus?</h1>
            <p className="text-sm text-[#666] mb-5">Graus na faixa {belt.name} (0 = sem grau).</p>
            <div className="flex gap-2 flex-wrap mb-6">
              {Array.from({ length: belt.maxDeg + 1 }).map((_, i) => (
                <button key={i} onClick={() => setDegrees(i)}
                  className={`w-12 h-12 rounded-full border-2 font-bold text-base transition-all ${degrees === i ? 'bg-[#FF6B2B] border-[#FF6B2B] text-white' : 'bg-white border-[#E8E3DC] text-[#1A1A2E]'}`}>
                  {i}
                </button>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button className="btn-primary" disabled={loading} onClick={finish}>
              {loading ? 'Salvando...' : 'Começar minha jornada 🥋'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
