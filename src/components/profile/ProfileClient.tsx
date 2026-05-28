'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BELTS } from '@/lib/curriculum'
import BottomNav from '@/components/ui/BottomNav'
import { signOut } from '@/app/(auth)/login/actions'
import type { Database } from '@/lib/supabase/types'
import type { BeltId } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

const BADGES: Record<string, { emoji: string; name: string }> = {
  first_technique:  { emoji: '🎯', name: 'Primeira técnica' },
  ten_techniques:   { emoji: '🔟', name: '10 técnicas' },
  fifty_techniques: { emoji: '💪', name: '50 técnicas' },
  first_train:      { emoji: '🥋', name: 'Primeiro treino' },
  week_streak:      { emoji: '🔥', name: '7 dias seguidos' },
  month_streak:     { emoji: '⚡', name: '30 dias seguidos' },
  belt_complete:    { emoji: '🏆', name: 'Faixa completa' },
  hundred_xp:       { emoji: '⭐', name: '100 XP' },
}

interface Props {
  profile: Profile
  achievements: { badge_id: string; unlocked_at: string }[]
  attendanceCount: number
  appUrl: string
  isOwner: boolean
  isAcademyAdmin: boolean
  academies: { id: string; name: string }[]
}

export default function ProfileClient({
  profile, achievements, attendanceCount, appUrl,
  isOwner, isAcademyAdmin, academies,
}: Props) {
  const router = useRouter()
  const belt = BELTS.find(b => b.id === profile.belt_id) ?? BELTS[0]
  const initial = (profile.name?.charAt(0) ?? '?').toUpperCase()

  const [editing, setEditing] = useState(false)
  const [name,        setName]        = useState(profile.name ?? '')
  const [beltId,      setBeltId]      = useState<BeltId>((profile.belt_id ?? 'white') as BeltId)
  const [degrees,     setDegrees]     = useState(profile.degrees ?? 0)
  const [isPublic,    setIsPublic]    = useState(profile.is_public ?? false)
  const [academyName, setAcademyName] = useState(profile.academy_name ?? '')
  const [customAcad,  setCustomAcad]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  const currentBelt = BELTS.find(b => b.id === beltId) ?? BELTS[0]

  async function save() {
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const finalAcademy = customAcad.trim() || academyName || null

    const { error: err } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
      .update({
        name:         name.trim(),
        belt_id:      beltId,
        degrees,
        is_public:    isPublic,
        academy_name: finalAcademy,
      } as never)
      .eq('id', profile.id)

    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <h1 className="font-black text-base tracking-tight">Meu Perfil</h1>
        <button onClick={() => { setEditing(e => !e); setError('') }}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
            editing ? 'bg-[#CC0000] text-white' : 'bg-[#F2F0ED] text-[#555]'
          }`}>
          {editing ? 'Cancelar' : '✏️ Editar'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pt-4 pb-24 space-y-3">

        {/* Saved toast */}
        {saved && (
          <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-2xl px-4 py-2.5 text-[#16A34A] font-bold text-sm flex items-center gap-2">
            ✅ Perfil atualizado com sucesso!
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5 text-red-600 text-sm font-bold">
            ⚠️ {error}
          </div>
        )}

        {/* Hero card */}
        <div className="relative overflow-hidden rounded-2xl text-white"
          style={{ background: 'linear-gradient(160deg, #0D0D0D 0%, #1A1A1A 100%)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#CC0000] rounded-full opacity-10 -translate-y-1/2 translate-x-1/2" />
          <div className="px-5 pt-6 pb-5 relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-[#CC0000] flex items-center justify-center text-white font-black text-2xl border-2 border-white/20">
                {initial}
              </div>
              <div className="flex-1">
                {editing ? (
                  <input
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white text-base font-black outline-none focus:border-[#CC0000] w-full"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-xl font-black tracking-tight">{profile.name}</h2>
                )}
                <p className="text-white/40 text-sm mt-0.5">@{profile.username}</p>
              </div>
            </div>

            {/* Belt bar — shows edited belt when in edit mode */}
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2 mb-3">
              <div className="flex-1 h-5 rounded flex items-center overflow-hidden"
                style={{ background: editing ? currentBelt.color : belt.color }}>
                <div className="flex-1" />
                {Array.from({ length: editing ? degrees : (profile.degrees ?? 0) }).map((_, i) => (
                  <div key={i} className="w-1.5 h-[65%] bg-white/70 rounded-sm mr-0.5" />
                ))}
                <div className="w-3 h-full bg-black/80" />
              </div>
              <span className="text-white font-black text-sm flex-shrink-0">
                Faixa {editing ? currentBelt.name : belt.name}
              </span>
              {(editing ? degrees : (profile.degrees ?? 0)) > 0 && (
                <span className="text-white/40 text-xs">
                  · {editing ? degrees : profile.degrees}° grau
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { n: attendanceCount, l: 'Treinos' },
                { n: profile.xp,     l: 'XP' },
                { n: profile.streak, l: 'Sequência' },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <p className="text-white font-black text-xl leading-none">{s.n}</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── EDIT FORM ── */}
        {editing && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#555]">Editar perfil</p>

            {/* Belt selector */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-[#555] block mb-2">Faixa atual</label>
              <div className="space-y-1.5">
                {BELTS.map(b => (
                  <div key={b.id} onClick={() => { setBeltId(b.id); setDegrees(0) }}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      beltId === b.id ? 'border-[#CC0000] bg-[#FFF0F0]' : 'border-[#E5E5E5]'
                    }`}>
                    <div className="w-8 h-5 rounded flex-shrink-0 border border-black/10" style={{ background: b.color }} />
                    <span className="text-sm font-bold flex-1">Faixa {b.name}</span>
                    {beltId === b.id && <span className="text-[#CC0000] font-black text-sm">✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Degrees */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-[#555] block mb-2">
                Grau na faixa {currentBelt.name}
              </label>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: currentBelt.maxDeg + 1 }, (_, i) => (
                  <button key={i} onClick={() => setDegrees(i)}
                    className={`w-10 h-10 rounded-full border-2 font-black text-sm transition-all ${
                      degrees === i
                        ? 'bg-[#CC0000] border-[#CC0000] text-white shadow-md shadow-red-900/20'
                        : 'bg-white border-[#E5E5E5] text-[#555]'
                    }`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Academy */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-[#555] block mb-2">Academia</label>
              {academies.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {academies.map(a => (
                    <button key={a.id} onClick={() => { setAcademyName(a.name); setCustomAcad('') }}
                      className={`py-2 px-3 rounded-xl border-2 text-xs font-bold text-left transition-all truncate ${
                        academyName === a.name && !customAcad
                          ? 'border-[#CC0000] bg-[#FFF0F0] text-[#CC0000]'
                          : 'border-[#E5E5E5] text-[#555]'
                      }`}>
                      {a.name}
                    </button>
                  ))}
                  <button onClick={() => { setAcademyName(''); }}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      !academyName && !customAcad
                        ? 'border-[#CC0000] bg-[#FFF0F0] text-[#CC0000]'
                        : 'border-[#E5E5E5] text-[#555]'
                    }`}>
                    Nenhuma
                  </button>
                </div>
              )}
              <input
                className="w-full bg-[#F8F7F5] border border-[#E5E5E5] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#CC0000] placeholder:text-[#BBB]"
                placeholder="Ou digite o nome da sua academia..."
                value={customAcad}
                onChange={e => { setCustomAcad(e.target.value); setAcademyName('') }}
              />
            </div>

            {/* Public toggle */}
            <div className="flex items-center justify-between py-2 border-t border-[#F2F0ED]">
              <div>
                <p className="text-sm font-bold">Perfil público</p>
                <p className="text-xs text-[#AAA] mt-0.5">Permite compartilhar seu perfil</p>
              </div>
              <button onClick={() => setIsPublic(p => !p)}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${isPublic ? 'bg-[#CC0000]' : 'bg-[#E5E5E5]'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <button onClick={save} disabled={saving || !name.trim()}
              className="w-full bg-[#CC0000] text-white font-black py-3.5 rounded-full text-sm disabled:opacity-50 shadow-lg shadow-red-900/20">
              {saving ? 'Salvando...' : '✓ Salvar alterações'}
            </button>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-3">
              Conquistas ({achievements.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {achievements.map(a => {
                const badge = BADGES[a.badge_id]
                if (!badge) return null
                return (
                  <div key={a.badge_id}
                    className="flex items-center gap-1.5 bg-[#FFF0F0] border border-[#FFCCCC] rounded-full px-3 py-1.5 text-[11px] font-bold text-[#CC0000]"
                    title={new Date(a.unlocked_at).toLocaleDateString('pt-BR')}>
                    <span>{badge.emoji}</span>
                    <span>{badge.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Profile public link */}
        {profile.is_public && profile.username && (
          <Link href={`/profile/${profile.username}`}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm hover:bg-[#F8F7F5] transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F0] flex items-center justify-center text-[#CC0000] text-lg">👤</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0D0D0D]">Ver perfil público</p>
              <p className="text-xs text-[#AAA] truncate">{appUrl}/profile/{profile.username}</p>
            </div>
            <span className="text-[#AAA]">›</span>
          </Link>
        )}

        {/* Admin links — only for owner */}
        {isOwner && (
          <Link href="/owner"
            className="flex items-center gap-3 bg-[#0D0D0D] rounded-2xl p-4 hover:bg-[#1A1A1A] transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#CC0000]/20 flex items-center justify-center text-[#CC0000] text-lg">⚙️</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Painel Owner</p>
              <p className="text-xs text-white/40">Gestão completa da plataforma</p>
            </div>
            <span className="text-white/30">›</span>
          </Link>
        )}

        {/* Academia link — only for academy admins/instructors */}
        {isAcademyAdmin && (
          <Link href="/academia"
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm hover:bg-[#F8F7F5] transition-colors border border-[#E5E5E5]">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F0] flex items-center justify-center text-lg">🏢</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#0D0D0D]">Painel Academia</p>
              <p className="text-xs text-[#AAA]">Gerenciar alunos e promoções</p>
            </div>
            <span className="text-[#AAA]">›</span>
          </Link>
        )}

        {/* Logout */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <form action={signOut}>
            <button type="submit"
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 text-lg">🚪</div>
              <p className="text-sm font-bold text-red-500">Sair da conta</p>
            </button>
          </form>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  )
}
