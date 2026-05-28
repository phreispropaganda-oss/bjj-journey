'use client'

import Link from 'next/link'
import { BELTS, getTotalTechniques } from '@/lib/curriculum'
import { getXPLevel, getXPProgress } from '@/store/user'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface Props {
  profile: Profile
  attendance: { date: string }[]
  completions: { belt_id: string; module_id: string; technique_name: string }[]
}

function BeltBar({ beltId, degrees }: { beltId: string; degrees: number }) {
  const belt = BELTS.find(b => b.id === beltId) ?? BELTS[0]
  return (
    <div className="flex items-center gap-1 h-5 rounded-md overflow-hidden flex-1" style={{ background: belt.color }}>
      <div className="flex-1" />
      {Array.from({ length: degrees }).map((_, i) => (
        <div key={i} className="w-2 h-[60%] bg-white/75 rounded-sm mr-0.5" />
      ))}
      <div className="w-4 h-full" style={{ background: '#1A1A1A' }} />
    </div>
  )
}

export function DashboardClient({ profile, attendance, completions }: Props) {
  const belt = BELTS.find(b => b.id === profile.belt_id) ?? BELTS[0]
  const totalTechs = getTotalTechniques(profile.belt_id)
  const doneTechs = completions.filter(c => c.belt_id === profile.belt_id).length
  const pct = totalTechs > 0 ? Math.round((doneTechs / totalTechs) * 100) : 0
  const level = getXPLevel(profile.xp)
  const xpPct = getXPProgress(profile.xp)
  const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="min-h-screen bg-[#F7F4F0]">
      <div className="bg-white border-b border-[#E8E3DC] px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">🥋 BJJ Journey</span>
        <Link href={`/profile/${profile.username}`} className="w-9 h-9 rounded-full bg-[#FF6B2B] flex items-center justify-center text-white font-bold text-sm">
          {(profile.name?.charAt(0) ?? '?').toUpperCase()}
        </Link>
      </div>

      <div className="p-4 space-y-3 pb-6">
        <div className="rounded-2xl p-4 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF6B2B 0%, #FF8C5A 100%)' }}>
          <div className="absolute -right-4 -top-5 w-24 h-24 bg-white/10 rounded-full" />
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs opacity-85">{greeting} 👋</p>
              <p className="text-xl font-bold">{profile.name}</p>
            </div>
            {profile.academy_name && (
              <span className="text-[11px] bg-white/20 rounded-full px-2.5 py-1 backdrop-blur-sm">{profile.academy_name}</span>
            )}
          </div>
          <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 cursor-pointer mb-3">
            <BeltBar beltId={profile.belt_id} degrees={profile.degrees} />
            <div className="text-right">
              <p className="text-sm font-bold">Faixa {belt.name}</p>
              <p className="text-[9px] opacity-70">Ver módulos →</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="bg-white/20 rounded-full px-2.5 py-1 text-[11px] font-semibold">⚡ {profile.xp} XP</span>
            <span className="bg-white/20 rounded-full px-2.5 py-1 text-[11px] font-semibold">🔥 {profile.streak} dias</span>
          </div>
        </div>
      </div>
    </div>
  )
}
