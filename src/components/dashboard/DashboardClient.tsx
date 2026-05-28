'use client'

import Link from 'next/link'
import { BELTS, getTotalTechniques } from '@/lib/curriculum'
import { getXPLevel, getXPProgress } from '@/store/user'
import BottomNav from '@/components/ui/BottomNav'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface Props {
  profile: Profile
  attendance: { date: string }[]
  completions: { belt_id: string; module_id: string; technique_name: string }[]
}

function Ring({ pct, color, size = 52 }: { pct: number; color: string; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F2F0ED" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  )
}

function BeltBar({ beltId, degrees }: { beltId: string; degrees: number }) {
  const b = BELTS.find(x => x.id === beltId) ?? BELTS[0]
  return (
    <div className="flex-1 h-5 rounded flex items-center overflow-hidden" style={{ background: b.color }}>
      <div className="flex-1" />
      {Array.from({ length: degrees }).map((_, i) => (
        <div key={i} className="w-1.5 h-[65%] bg-white/70 rounded-sm mr-0.5" />
      ))}
      <div className="w-3 h-full bg-black/80" />
    </div>
  )
}

export function DashboardClient({ profile, attendance, completions }: Props) {
  const belt    = BELTS.find(b => b.id === profile.belt_id) ?? BELTS[0]
  const total   = getTotalTechniques(profile.belt_id)
  const done    = completions.filter(c => c.belt_id === profile.belt_id).length
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0
  const level   = getXPLevel(profile.xp)
  const xpPct   = getXPProgress(profile.xp)
  const streak  = profile.streak ?? 0
  const hrs     = new Date().getHours()
  const greeting = hrs < 12 ? 'Bom dia' : hrs < 18 ? 'Boa tarde' : 'Boa noite'
  const initial = (profile.name?.charAt(0) ?? '?').toUpperCase()

  // Treinos this week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekTrains = attendance.filter(a => new Date(a.date) >= weekStart).length

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#CC0000] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-[10px] tracking-tighter">BR</span>
          </div>
          <span className="font-black text-[#0D0D0D] text-base tracking-tight">Belt Rise</span>
        </div>
        <Link href={`/profile/${profile.username}`}
          className="w-9 h-9 rounded-full bg-[#CC0000] flex items-center justify-center text-white font-black text-sm shadow-md shadow-red-900/20">
          {initial}
        </Link>
      </div>

      {/* Scroll content */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pt-4 pb-24">

        {/* Hero card — vermelho */}
        <div className="rounded-2xl p-4 text-white mb-3 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #CC0000 0%, #E52222 100%)' }}>
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute -left-4 bottom-0 w-20 h-20 bg-black/10 rounded-full" />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs opacity-75">{greeting} 👋</p>
                <p className="text-xl font-black tracking-tight leading-tight">{profile.name}</p>
              </div>
              {profile.academy_name && (
                <span className="text-[11px] bg-white/20 rounded-full px-2.5 py-1 font-semibold backdrop-blur-sm">
                  {profile.academy_name}
                </span>
              )}
            </div>

            {/* Belt bar */}
            <Link href={`/modules/${profile.belt_id}`}
              className="flex items-center gap-3 bg-white/15 rounded-xl px-3 py-2.5 mb-3 active:bg-white/20">
              <BeltBar beltId={profile.belt_id} degrees={profile.degrees} />
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black">Faixa {belt.name}</p>
                <p className="text-[10px] opacity-60">Ver módulos →</p>
              </div>
            </Link>

            {/* Chips */}
            <div className="flex gap-2 flex-wrap">
              <span className="bg-white/20 rounded-full px-2.5 py-1 text-[11px] font-bold">⚡ {profile.xp} XP</span>
              <span className="bg-white/20 rounded-full px-2.5 py-1 text-[11px] font-bold">🔥 {streak} dias</span>
              <span className="bg-white/20 rounded-full px-2.5 py-1 text-[11px] font-bold">🥋 {weekTrains}× semana</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Técnicas', value: done, total, pct, color: belt.color },
            { label: 'Treinos', value: attendance.length, total: 30, pct: Math.min(100, Math.round((attendance.length / 30) * 100)), color: '#CC0000' },
            { label: 'Sequência', value: streak, total: 7, pct: Math.min(100, Math.round((streak / 7) * 100)), color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-sm flex flex-col items-center gap-1">
              <div className="relative">
                <Ring pct={s.pct} color={s.color} size={52} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[13px] font-black leading-none" style={{ color: s.color }}>{s.pct}%</span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-[#555]">{s.label}</p>
              <p className="text-xs text-[#AAA]">{s.value}{s.total ? `/${s.total}` : ''}</p>
            </div>
          ))}
        </div>

        {/* XP / Nível */}
        <div className="bg-[#FFF0F0] rounded-2xl p-4 mb-3">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span className="text-sm font-black text-[#0D0D0D]">Nível {level}</span>
            </div>
            <span className="bg-[#CC0000] text-white text-[11px] font-black rounded-full px-2.5 py-0.5">Nível {level}</span>
          </div>
          <div className="h-2 bg-[#FFCCCC] rounded-full overflow-hidden mb-1.5">
            <div className="h-full bg-[#CC0000] rounded-full transition-all" style={{ width: `${xpPct}%` }} />
          </div>
          <p className="text-[11px] text-[#CC0000] font-semibold">{profile.xp} / {level * 500} XP</p>
        </div>

        {/* Next technique CTA */}
        <Link href={`/modules/${profile.belt_id}`}
          className="bg-[#0D0D0D] rounded-2xl p-4 mb-3 flex items-center justify-between group block">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Próximo na jornada</p>
            <p className="text-white font-black text-base tracking-tight">
              {done < total ? `${done} de ${total} técnicas` : '🏆 Faixa completa!'}
            </p>
            <p className="text-white/50 text-xs mt-0.5">Faixa {belt.name} · {pct}% concluído</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#CC0000] flex items-center justify-center text-white font-black text-lg group-hover:scale-110 transition-transform">
            →
          </div>
        </Link>

        {/* Explore belts */}
        <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-3">Explorar faixas</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
            {BELTS.map(b => (
              <Link key={b.id} href={`/modules/${b.id}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 flex-shrink-0 text-sm font-bold transition-all ${
                  b.id === profile.belt_id
                    ? 'text-white border-transparent'
                    : 'bg-white border-[#E5E5E5] text-[#555]'
                }`}
                style={b.id === profile.belt_id ? { background: b.color, borderColor: b.color } : {}}>
                <div className="w-4 h-3 rounded-sm border border-black/10" style={{ background: b.color }} />
                {b.name}
                {b.id === profile.belt_id && <span className="text-[9px] opacity-75">minha</span>}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <BottomNav active="dashboard" />
    </div>
  )
}
