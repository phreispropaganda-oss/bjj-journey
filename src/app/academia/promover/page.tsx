'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BELTS } from '@/lib/curriculum'

const BELT_COLOR: Record<string, string> = {
  white:'#E8E8E8', blue:'#2563EB', purple:'#7C3AED', brown:'#92400E', black:'#1A1A1A',
}

type Student = {
  id: string; name: string; username: string; belt_id: string; degrees: number;
}

export default function PromoverPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [academyId, setAcademyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Student | null>(null)
  const [toBelt, setToBelt] = useState('')
  const [toDegrees, setToDegrees] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [history, setHistory] = useState<{ name: string; to_belt: string; to_degrees: number; promoted_at: string }[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: mem } = await supabase
        .from('academy_members').select('academy_id').eq('user_id', user.id)
        .in('role', ['admin','instructor']).maybeSingle()
      const aId = (mem as { academy_id: string } | null)?.academy_id
      if (!aId) return
      setAcademyId(aId)

      const { data: members } = await supabase
        .from('academy_members').select('user_id').eq('academy_id', aId).eq('active', true)
      const ids = ((members ?? []) as { user_id: string }[]).map(m => m.user_id)
      if (!ids.length) { setLoading(false); return }

      const [{ data: profiles }, { data: promos }] = await Promise.all([
        supabase.from('profiles').select('id, name, username, belt_id, degrees').in('id', ids),
        supabase.from('belt_promotions')
          .select('user_id, to_belt, to_degrees, promoted_at')
          .eq('academy_id', aId)
          .order('promoted_at', { ascending: false })
          .limit(20),
      ])

      const profs = (profiles ?? []) as Student[]
      setStudents(profs.sort((a, b) => a.name?.localeCompare(b.name ?? '') ?? 0))

      const promoList = (promos ?? []) as { user_id: string; to_belt: string; to_degrees: number; promoted_at: string }[]
      setHistory(promoList.map(p => {
        const prof = profs.find(x => x.id === p.user_id)
        return { name: prof?.name ?? 'Aluno', to_belt: p.to_belt, to_degrees: p.to_degrees, promoted_at: p.promoted_at }
      }))
      setLoading(false)
    }
    load()
  }, [])

  function selectStudent(s: Student) {
    setSelected(s)
    setToBelt(s.belt_id)
    setToDegrees(s.degrees)
    setSuccess('')
    setNotes('')
  }

  async function promote() {
    if (!selected || !toBelt || !academyId) return
    setSaving(true)
    const supabase = createClient()
    await (supabase as any).rpc('promote_student', {
      p_user_id: selected.id,
      p_to_belt: toBelt,
      p_to_degrees: toDegrees,
      p_academy_id: academyId,
      p_notes: notes || null,
    })
    setSaving(false)
    setSuccess(`✅ ${selected.name} promovido para Faixa ${BELTS.find(b => b.id === toBelt)?.name ?? toBelt}, ${toDegrees}° grau!`)
    setStudents(prev => prev.map(s => s.id === selected.id ? { ...s, belt_id: toBelt, degrees: toDegrees } : s))
    setSelected(null)
    setTimeout(() => setSuccess(''), 4000)
  }

  const toBeltObj = BELTS.find(b => b.id === toBelt)

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="bg-[#1A1A1A] border-b border-[#333] px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/academia" className="text-[#555] text-sm">← Academia</Link>
          <h1 className="text-white font-black text-base flex-1">Promover Faixas</h1>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-none">
          {[
            { href: '/academia',            label: '📊 Visão Geral' },
            { href: '/academia/alunos',     label: '👥 Alunos' },
            { href: '/academia/frequencia', label: '✅ Presenças' },
            { href: '/academia/promover',   label: '🏅 Promover' },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                t.href === '/academia/promover' ? 'bg-[#CC0000] text-white' : 'bg-[#222] text-[#555]'
              }`}>
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto pb-10">
        {success && (
          <div className="bg-green-900/30 border border-green-700 rounded-2xl px-4 py-3 text-green-400 font-bold text-sm">
            {success}
          </div>
        )}

        {/* Select student */}
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2A2A2A]">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#555]">Selecionar aluno</p>
          </div>
          {loading ? (
            <p className="text-[#555] text-sm px-4 py-4">Carregando...</p>
          ) : students.map(s => (
            <div key={s.id}
              onClick={() => selectStudent(s)}
              className={`flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] cursor-pointer transition-all ${
                selected?.id === s.id ? 'bg-[#CC0000]/10 border-[#CC0000]/30' : 'hover:bg-[#222]'
              }`}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs"
                style={{ background: BELT_COLOR[s.belt_id] }}>
                {(s.name?.charAt(0) ?? '?').toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-bold">{s.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-3 h-2 rounded-sm border border-white/10" style={{ background: BELT_COLOR[s.belt_id] }} />
                  <span className="text-[#555] text-[10px]">
                    Faixa {BELTS.find(b => b.id === s.belt_id)?.name ?? s.belt_id}, {s.degrees}° grau
                  </span>
                </div>
              </div>
              {selected?.id === s.id && <span className="text-[#CC0000] font-black">✓</span>}
            </div>
          ))}
        </div>

        {/* Promotion form */}
        {selected && (
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#CC0000]/30">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-4">
              Promovendo: <span className="text-white">{selected.name}</span>
            </p>

            {/* Belt selector */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#555] mb-2">Nova faixa</p>
            <div className="space-y-2 mb-4">
              {BELTS.map(b => (
                <div key={b.id} onClick={() => { setToBelt(b.id); setToDegrees(0) }}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    toBelt === b.id ? 'border-[#CC0000] bg-[#CC0000]/10' : 'border-[#333] bg-[#222]'
                  }`}>
                  <div className="w-8 h-5 rounded flex-shrink-0 border border-white/10" style={{ background: b.color }} />
                  <p className="text-white text-sm font-bold flex-1">Faixa {b.name}</p>
                  {toBelt === b.id && <span className="text-[#CC0000] font-black">✓</span>}
                </div>
              ))}
            </div>

            {/* Degrees */}
            {toBeltObj && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#555] mb-2">Grau</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {Array.from({ length: toBeltObj.maxDeg + 1 }, (_, i) => (
                    <button key={i} onClick={() => setToDegrees(i)}
                      className={`w-10 h-10 rounded-full border-2 font-black text-sm transition-all ${
                        toDegrees === i ? 'border-[#CC0000] bg-[#CC0000] text-white' : 'border-[#333] text-[#555]'
                      }`}>{i}</button>
                  ))}
                </div>
              </>
            )}

            {/* Notes */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#555] mb-2">Observação <span className="normal-case font-normal text-[#444]">(opcional)</span></p>
            <textarea
              className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-white text-sm outline-none placeholder:text-[#444] focus:border-[#CC0000] resize-none mb-4"
              rows={2}
              placeholder="Ex: Aprovado no exame de faixa azul em 28/05/2026"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />

            <button onClick={promote} disabled={saving || !toBelt}
              className="w-full py-3.5 bg-[#CC0000] text-white font-black rounded-full text-sm disabled:opacity-50">
              {saving ? 'Registrando...' : `🏅 Confirmar promoção → Faixa ${toBeltObj?.name ?? ''}, ${toDegrees}° grau`}
            </button>
          </div>
        )}

        {/* Promotion history */}
        {history.length > 0 && (
          <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2A2A2A]">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#555]">Histórico de promoções</p>
            </div>
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1E1E1E]">
                <span className="text-lg">🏅</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-bold">{h.name}</p>
                  <p className="text-[#555] text-[11px]">
                    Faixa {BELTS.find(b => b.id === h.to_belt)?.name ?? h.to_belt}, {h.to_degrees}° grau · {new Date(h.promoted_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="w-4 h-3 rounded-sm border border-white/10" style={{ background: BELT_COLOR[h.to_belt] }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
