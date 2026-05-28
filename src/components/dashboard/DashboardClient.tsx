'use client'

import Link from 'next/link'
import { BELTS, getTotalTechniques, getCurriculumByBelt } from '@/lib/curriculum'
import { getXPLevel, getXPProgress } from '@/store/user'
import BottomNav from '@/components/ui/BottomNav'
import type { Database } from '@/lib/supabase/types'
import type { BeltId } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface Props {
  profile: Profile
  attendance: { date: string }[]
  completions: { belt_id: string; module_id: string; technique_name: string }[]
  achievements: { badge_id: string; unlocked_at: string }[]
}

// Badge definitions
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

function MiniHeatmap({ attendance }: { attendance: { date: string }[] }) {
  const today = new Date()
  const attendSet = new Set(attendance.map(a => a.date))
  const days: { date: string; present: boolean; isToday: boolean }[] = []
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    days.push({ date: ds, present: attendSet.has(ds), isToday: i === 0 })
  }
  return (
    <div className="flex gap-0.5 flex-wrap">
      {days.map(d => (
        <div key={d.date}
          title={d.date}
          className={`w-4 h-4 rounded-sm ${
            d.present ? 'bg-[#CC0000]' :
            d.isToday ? 'bg-[#FFCCCC] border border-[#CC0000]' :
            'bg-[#F2F0ED]'
          }`} />
      ))}
    </div>
  )
}

function NextTechniqueCard({ beltId, completions }: {
  beltId: string
  completions: { belt_id: string; module_id: string; technique_name: string }[]
}) {
  const curriculum = getCurriculumByBelt(beltId as BeltId)
  const belt = BELTS.find(b => b.id === beltId) ?? BELTS[0]
  if (!curriculum) return null

  const doneKeys = new Set(
    completions.filter(c => c.belt_id === beltId)
      .map(c => `${c.module_id}:${c.technique_name}`)
  )

  // Find first incomplete technique
  let nextTech: { name: string; modLabel: string; catName: string } | null = null
  outer: for (const mod of curriculum.modules) {
    for (const cat of mod.categories) {
      for (const tech of cat.techniques) {
        if (!doneKeys.has(`${mod.id}:${tech.name}`)) {
          nextTech = { name: tech.name, modLabel: mod.label, catName: cat.name }
          break outer
        }
      }
    }
  }

  const totalTechs = curriculum.modules.reduce((a, m) =>
    a + m.categories.reduce((b, c) => b + c.techniques.length, 0), 0)
  const doneTechs = doneKeys.size
  const pct = totalTechs > 0 ? Math.round((doneTechs / totalTechs) * 100) : 0

  return (
    <Link href={`/modules/${beltId}`}
      className="bg-[#0D0D0D] rounded-2xl p-4 mb-3 flex items-start justify-between group block">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">
          {nextTech ? 'Próxima técnica' : 'Faixa concluída'}
        </p>
        {nextTech ? (
          <>
            <p className="text-white font-black text-base tracking-tight leading-tight mb-0.5 truncate">
              {nextTech.name}
            </p>
            <p className="text-white/40 text-xs truncate">{nextTech.modLabel} · {nextTech.catName}</p>
          </>
        ) : (
          <p className="text-[#CC0000] font-black text-base">🏆 Faixa {belt.name} completa!</p>
        )}
        {/* Progress bar */}
        <div className="mt-2.5 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#CC0000] rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-white/30 text-[10px] mt-1">{doneTechs}/{totalTechs} técnicas · {pct}%</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-[#CC0000] flex items-center justify-center text-white font-black text-lg ml-3 mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0">
        →
      </div>
    </Link>
  )
}

export function DashboardClient({ profile, attendance, completions, achievements }: Props) {
  const belt    = BELTS.find(b => b.id === profile.belt_id) ?? BELTS[0]
  const total   = getTotalTechniques(profile.belt_id as BeltId)
  const done    = completions.filter(c => c.belt_id === profile.belt_id).length
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0
  const level   = getXPLevel(profile.xp)
  const xpPct   = getXPProgress(profile.xp)
  const streak  = profile.streak ?? 0
  const hrs     = new Date().getHours()
  const greeting = hrs < 12 ? 'Bom dia' : hrs < 18 ? 'Boa tarde' : 'Boa noite'
  const initial = (profile.name?.charAt(0) ?? '?').toUpperCase()

  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekTrains = attendance.filter(a => new Date(a.date) >= weekStart).length

  const trainedToday = attendance.some(a => a.date === today.toISOString().split('T')[0])

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
        <Link href="/profile"
          className="w-9 h-9 rounded-full bg-[#CC0000] flex items-center justify-center text-white font-black text-sm shadow-md shadow-red-900/20">
          {initial}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pt-4 pb-24">

        {/* Hero */}
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
                <span className="text-[11px] bg-white/20 rounded-full px-2.5 py-1 font-semibold backdrop-blur-sm max-w-[120px] truncate">
                  {profile.academy_name}
                </span>
              )}
            </div>
            <Link href={`/modules/${profile.belt_id}`}
              className="flex items-center gap-3 bg-white/15 rounded-xl px-3 py-2.5 mb-3 active:bg-white/20">
              <BeltBar beltId={profile.belt_id} degrees={profile.degrees} />
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black">Faixa {belt.name}</p>
                <p className="text-[10px] opacity-60">Ver módulos →</p>
              </div>
            </Link>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-white/20 rounded-full px-2.5 py-1 text-[11px] font-bold">⚡ {profile.xp} XP</span>
              <span className="bg-white/20 rounded-full px-2.5 py-1 text-[11px] font-bold">🔥 {streak} dias</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${trainedToday ? 'bg-white/30' : 'bg-white/15'}`}>
                🥋 {weekTrains}× esta semana
              </span>
            </div>
          </div>
        </div>

        {/* Stats rings */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Técnicas', value: done, total, pct, color: belt.color },
            { label: 'Treinos', value: attendance.length, total: 50, pct: Math.min(100, Math.round((attendance.length / 50) * 100)), color: '#CC0000' },
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

        {/* XP bar */}
        <div className="bg-[#FFF0F0] rounded-2xl p-4 mb-3">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span className="text-sm font-black text-[#0D0D0D]">Nível {level}</span>
            </div>
            <span className="bg-[#CC0000] text-white text-[11px] font-black rounded-full px-2.5 py-0.5">
              {profile.xp} / {level * 500} XP
            </span>
          </div>
          <div className="h-2 bg-[#FFCCCC] rounded-full overflow-hidden">
            <div className="h-full bg-[#CC0000] rounded-full transition-all duration-500" style={{ width: `${xpPct}%` }} />
          </div>
          {/* Badges */}
          {achievements.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {achievements.map(a => {
                const badge = BADGES[a.badge_id]
                if (!badge) return null
                return (
                  <div key={a.badge_id}
                    className="flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 text-[11px] font-bold text-[#555] border border-[#FFCCCC]"
                    title={new Date(a.unlocked_at).toLocaleDateString('pt-BR')}>
                    <span>{badge.emoji}</span>
                    <span>{badge.name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Next technique */}
        <NextTechniqueCard beltId={profile.belt_id} completions={completions} />

        {/* Mini attendance heatmap */}
        <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#555]">Últimos 35 dias</p>
            <Link href="/calendar" className="text-[#CC0000] text-xs font-bold">Ver tudo →</Link>
          </div>
          <MiniHeatmap attendance={attendance} />
          <div className="flex items-center gap-3 mt-2.5">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#CC0000]" />
              <span className="text-[10px] text-[#AAA]">treinou</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#F2F0ED]" />
              <span className="text-[10px] text-[#AAA]">não treinou</span>
            </div>
          </div>
        </div>

        {/* Registrar treino — CTA principal */}
        {!trainedToday && (
          <Link href="/treino/novo"
            className="block w-full text-center bg-[#CC0000] text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-red-900/20 mb-3 hover:bg-[#A80000] transition-colors">
            🥋 Registrar treino
          </Link>
        )}
        {trainedToday && (
          <Link href="/treino/novo"
            className="flex items-center justify-between gap-2 py-3 px-4 mb-3 bg-[#F0FDF4] rounded-2xl text-[#16A34A] font-bold text-sm border border-[#86EFAC] hover:bg-[#DCFCE7] transition-colors">
            <div className="flex items-center gap-2">
              <span>✅</span> Treino de hoje registrado!
            </div>
            <span className="text-[11px]">+ Outro treino</span>
          </Link>
        )}

        {/* Explore belts */}
        <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-3">Explorar faixas</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
            {BELTS.map(b => (
              <Link key={b.id} href={`/modules/${b.id}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 flex-shrink-0 text-sm font-bold transition-all ${
                  b.id === profile.belt_id
                    ? 'text-white border-transparent'
                    : 'bg-white border-[#E5E5E5] text-[#555] hover:border-[#CC0000] hover:text-[#CC0000]'
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
