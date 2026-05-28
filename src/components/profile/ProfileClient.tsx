'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BELTS } from '@/lib/curriculum'
import BottomNav from '@/components/ui/BottomNav'
import { signOut } from '@/app/(auth)/login/actions'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

const BELT_COLOR: Record<string, string> = {
  white:'#E8E8E8', blue:'#2563EB', purple:'#7C3AED', brown:'#92400E', black:'#1A1A1A',
}
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
}

export default function ProfileClient({ profile, achievements, attendanceCount, appUrl }: Props) {
  const router = useRouter()
  const belt = BELTS.find(b => b.id === profile.belt_id) ?? BELTS[0]
  const initial = (profile.name?.charAt(0) ?? '?').toUpperCase()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile.name ?? '')
  const [isPublic, setIsPublic] = useState(profile.is_public ?? false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    const supabase = createClient()
    await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
      .update({ name: name.trim(), is_public: isPublic } as never)
      .eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  const profileUrl = `${appUrl}/profile/${profile.username}`

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <h1 className="font-black text-base tracking-tight">Meu Perfil</h1>
        <button onClick={() => setEditing(e => !e)}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
            editing ? 'bg-[#CC0000] text-white' : 'bg-[#F2F0ED] text-[#555]'
          }`}>
          {editing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pt-4 pb-24 space-y-3">

        {saved && (
          <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-2xl px-4 py-2.5 text-[#16A34A] font-bold text-sm flex items-center gap-2">
            ✅ Perfil atualizado!
          </div>
        )}

        {/* Hero card */}
        <div className="relative overflow-hidden rounded-2xl text-white"
          style={{ background: 'linear-gradient(160deg, #0D0D0D 0%, #1A1A1A 100%)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#CC0000] rounded-full opacity-10 -translate-y-1/2 translate-x-1/2" />
          <div className="px-5 pt-6 pb-5 relative z-10">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-[#CC0000] flex items-center justify-center text-white font-black text-2xl border-2 border-white/20">
                {initial}
              </div>
              <div>
                {editing ? (
                  <input
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white text-base font-black outline-none focus:border-[#CC0000] w-full"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <h2 className="text-xl font-black tracking-tight">{profile.name}</h2>
                )}
                <p className="text-white/40 text-sm mt-0.5">@{profile.username}</p>
              </div>
            </div>

            {/* Belt bar */}
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2 mb-4">
              <div className="flex-1 h-5 rounded flex items-center overflow-hidden" style={{ background: belt.color }}>
                <div className="flex-1" />
                {Array.from({ length: profile.degrees }).map((_, i) => (
                  <div key={i} className="w-1.5 h-[65%] bg-white/70 rounded-sm mr-0.5" />
                ))}
                <div className="w-3 h-full bg-black/80" />
              </div>
              <span className="text-white font-black text-sm flex-shrink-0">Faixa {belt.name}</span>
              {profile.degrees > 0 && (
                <span className="text-white/40 text-xs">· {profile.degrees}° grau</span>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { n: attendanceCount, l: 'Treinos' },
                { n: profile.xp, l: 'XP' },
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

        {/* Edit form */}
        {editing && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-3">Configurações</p>

            {/* Public toggle */}
            <div className="flex items-center justify-between py-3 border-b border-[#F2F0ED]">
              <div>
                <p className="text-sm font-bold">Perfil público</p>
                <p className="text-xs text-[#AAA] mt-0.5">Permite que seu perfil seja compartilhado</p>
              </div>
              <button onClick={() => setIsPublic(p => !p)}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${isPublic ? 'bg-[#CC0000]' : 'bg-[#E5E5E5]'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <button onClick={save} disabled={saving || !name.trim()}
              className="w-full mt-4 bg-[#CC0000] text-white font-black py-3 rounded-full text-sm disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar alterações →'}
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
                    className="flex items-center gap-1.5 bg-[#FFF0F0] border border-[#FFCCCC] rounded-full px-3 py-1.5 text-[11px] font-bold text-[#CC0000]">
                    <span>{badge.emoji}</span>
                    <span>{badge.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#555] px-4 pt-4 pb-2">Ações</p>

          {/* View public profile */}
          {profile.is_public && (
            <Link href={`/profile/${profile.username}`}
              className="flex items-center gap-3 px-4 py-3 border-b border-[#F2F0ED] hover:bg-[#F8F7F5] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#FFF0F0] flex items-center justify-center text-[#CC0000] text-sm">👤</div>
              <div className="flex-1">
                <p className="text-sm font-bold">Ver perfil público</p>
                <p className="text-xs text-[#AAA] truncate">{profileUrl}</p>
              </div>
              <span className="text-[#AAA] text-sm">›</span>
            </Link>
          )}

          {/* Admin / Owner links */}
          <Link href="/owner"
            className="flex items-center gap-3 px-4 py-3 border-b border-[#F2F0ED] hover:bg-[#F8F7F5] transition-colors">
            <div className="w-8 h-8 rounded-lg bg-[#0D0D0D] flex items-center justify-center text-[10px] text-white font-black">⚙️</div>
            <div className="flex-1">
              <p className="text-sm font-bold">Painel Owner</p>
              <p className="text-xs text-[#AAA]">Gestão completa da plataforma</p>
            </div>
            <span className="text-[#AAA] text-sm">›</span>
          </Link>

          <Link href="/academia"
            className="flex items-center gap-3 px-4 py-3 border-b border-[#F2F0ED] hover:bg-[#F8F7F5] transition-colors">
            <div className="w-8 h-8 rounded-lg bg-[#FFF0F0] flex items-center justify-center text-sm">🏢</div>
            <div className="flex-1">
              <p className="text-sm font-bold">Painel Academia</p>
              <p className="text-xs text-[#AAA]">Gerenciar alunos e promoções</p>
            </div>
            <span className="text-[#AAA] text-sm">›</span>
          </Link>

          {/* Logout */}
          <form action={signOut}>
            <button type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 text-sm">🚪</div>
              <p className="text-sm font-bold text-red-500">Sair da conta</p>
            </button>
          </form>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  )
}
