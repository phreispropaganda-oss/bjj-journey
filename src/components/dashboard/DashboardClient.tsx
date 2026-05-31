'use client'

import Link from 'next/link'
import { BELTS, getTotalTechniques, getCurriculumByBelt } from '@/lib/curriculum'
import { getXPLevel, getXPProgress } from '@/store/user'
import BottomNav from '@/components/ui/BottomNav'
import NotificationBell from '@/components/ui/NotificationBell'
// TourOverlay removido — UX guideline: tooltips contextuais > full-screen overlay
import BeltRiseLogo from '@/components/ui/BeltRiseLogo'
import StreakShieldButton from '@/components/dashboard/StreakShieldButton'
import StoriesBar from '@/components/dashboard/StoriesBar'
import RecentActivity from '@/components/dashboard/RecentActivity'
import ActivityRings from '@/components/dashboard/charts/ActivityRings'
import MinutesBarChart from '@/components/dashboard/charts/MinutesBarChart'
import TypeBreakdown from '@/components/dashboard/charts/TypeBreakdown'
// StreakHeatmap legado substituído por HeatmapYoY (PRD §3.3)
import RadarChart8 from '@/components/dashboard/charts/RadarChart8'
import LevelProgress from '@/components/dashboard/charts/LevelProgress'
import PersonalRecords from '@/components/dashboard/charts/PersonalRecords'
import HeatmapYoY from '@/components/dashboard/charts/HeatmapYoY'
import type { Database } from '@/lib/supabase/types'
import type { BeltId } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface XPProgress {
  total_minutes: number; total_hours: number; current_level: number
  level_start_min: number; next_level_min: number
  minutes_in_level: number; minutes_to_next: number; level_progress_pct: number
}
interface RadarPoint { category: string; score: number; raw_count: number }
interface PR {
  longest_streak_days: number
  longest_session_min: number; longest_session_date: string | null
  most_subs_week: number; most_subs_week_start: string | null
  first_training_date: string | null
  most_active_month: string | null; most_active_month_count: number
}

interface Props {
  profile: Profile
  attendance: { date: string }[]
  completions: { belt_id: string; module_id: string; technique_name: string }[]
  achievements: { badge_id: string; unlocked_at: string }[]
  sessions: { id: string; type: string; duration_min: number; trained_at: string }[]
  xpProgress?: XPProgress
  radar?: RadarPoint[]
  personalRecords?: PR
}

// Badge definitions
import { BADGES } from '@/lib/badges'

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

export function DashboardClient({
  profile, attendance, completions, achievements, sessions,
  xpProgress, radar, personalRecords,
}: Props) {
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

  // Activity Rings metrics
  const weekMinutes = sessions
    .filter(s => new Date(s.trained_at) >= weekStart)
    .reduce((sum, s) => sum + (s.duration_min ?? 0), 0)

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* Top bar — Belt Rise logo */}
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center justify-between flex-shrink-0">
        <BeltRiseLogo size={32} />
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link href="/profile"
            className="w-10 h-10 rounded-full bg-rise flex items-center justify-center text-ink-primary font-black text-sm shadow-glow-rise min-h-tap min-w-tap">
            {initial}
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pt-4 pb-24">

        {/* Slogan + Stories bar Strava-style */}
        <p className="text-center text-[10px] font-black uppercase tracking-[0.35em] text-ink-muted mb-2">
          Treine. <span className="text-rise">Suba.</span> Conquiste.
        </p>
        <StoriesBar currentUserId={profile.id} />

        {/* INICIAR TREINO + Check-in — par compacto */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Link href="/treino/novo"
            className="col-span-2 bg-rise rounded-2xl py-4 px-4 text-center shadow-glow-rise active:scale-[0.98] transition-transform">
            <div className="text-2xl mb-0.5">🥊</div>
            <p className="text-white font-display text-base tracking-wide">INICIAR TREINO</p>
          </Link>
          <Link href="/checkin"
            className="bg-brand-surface border border-brand-elev rounded-2xl py-4 px-2 text-center active:bg-brand-hover">
            <div className="text-2xl mb-0.5">📍</div>
            <p className="text-ink-primary font-display text-xs">Check-in</p>
          </Link>
        </div>

        {/* Progresso da Graduacao — Belt Rise hero card */}
        {(() => {
          const nextBeltIdx = BELTS.findIndex(b => b.id === profile.belt_id) + 1
          const nextBelt = BELTS[nextBeltIdx]
          const progressPct = belt.maxDeg > 0 ? Math.round((profile.degrees / belt.maxDeg) * 100) : 0
          return (
            <Link href={`/modules/${profile.belt_id}`}
              className="block bg-brand-surface rounded-2xl border border-brand-elev p-4 mb-3 active:bg-brand-elev">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 flex items-center justify-center font-black text-ink-primary"
                  style={{ borderColor: belt.color, background: belt.color }}>
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary">Progresso da graduacao</p>
                  <p className="font-display text-ink-primary text-lg">
                    {progressPct}% para Faixa {nextBelt?.name ?? 'mestre'}
                  </p>
                </div>
                <p className="font-display text-rise text-3xl tabular-nums">{progressPct}%</p>
              </div>
              {/* Barra ascendente "rise" */}
              <div className="h-2.5 bg-brand-bg rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all bg-gradient-to-r from-rise via-rise to-volt"
                  style={{ width: `${progressPct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-ink-muted font-bold uppercase tracking-wider">
                <span>Faixa {belt.name} · {profile.degrees}/{belt.maxDeg} graus</span>
                <span className="text-rise">↗ subir</span>
              </div>
            </Link>
          )
        })()}

        {/* Recent Activity — lista dominante Strava-style */}
        <RecentActivity sessions={sessions} limit={5} />

        {/* Hero atual (mantido com cor laranja brand) */}
        <div className="rounded-2xl p-4 text-white mb-3 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #CC0000 0%, #9E0B13 100%)' }}>
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

        {/* Tour overlay removido — UX guideline: tooltips contextuais > overlay full-screen */}

        {/* Streak — versão suave e compacta */}
        <div className="block rounded-2xl p-3 mb-3 bg-brand-surface border border-brand-elev">
          <Link href="/calendar" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rise/15 flex items-center justify-center">
              <span className="text-xl">🔥</span>
            </div>
            <div className="flex-1">
              <p className="text-ink-secondary text-[10px] font-black uppercase tracking-wider">Streak atual</p>
              <p className="text-ink-primary font-display text-2xl leading-none tabular-nums">
                {streak}<span className="text-ink-muted text-sm font-bold ml-1">dias</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-ink-muted text-[9px] uppercase tracking-wider">Recorde</p>
              <p className="text-rise font-display text-base">{personalRecords?.longest_streak_days ?? streak}d</p>
            </div>
          </Link>
          {streak > 0 && (
            <StreakShieldButton streak={streak} />
          )}
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

        {/* PRD §3.1 — Level Logarítmico (server-side) */}
        {xpProgress ? (
          <div className="mb-3">
            <LevelProgress
              totalMinutes={xpProgress.total_minutes}
              totalHours={xpProgress.total_hours}
              currentLevel={xpProgress.current_level}
              levelStartMin={xpProgress.level_start_min}
              nextLevelMin={xpProgress.next_level_min}
              minutesInLevel={xpProgress.minutes_in_level}
              minutesToNext={xpProgress.minutes_to_next}
              levelProgressPct={xpProgress.level_progress_pct}
            />
          </div>
        ) : (
          // Legacy fallback (XP local)
          <div className="bg-blood/10 rounded-2xl p-4 mb-3 border border-blood/20">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <span className="text-sm font-display text-ink-primary">Nível {level}</span>
              </div>
              <span className="bg-blood text-ink-primary text-[11px] font-black rounded-full px-2.5 py-0.5">
                {profile.xp} XP
              </span>
            </div>
            <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
              <div className="h-full bg-blood rounded-full transition-all duration-500" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        )}

        {/* Badges */}
        {achievements.length > 0 && (
          <div className="card-elev mb-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary mb-2">
              🏅 Conquistas
            </p>
            <div className="flex gap-2 flex-wrap">
              {achievements.map(a => {
                const badge = BADGES[a.badge_id] ?? { emoji: '🏆', name: a.badge_id.replace(/_/g, ' ') }
                return (
                  <div key={a.badge_id}
                    className="flex items-center gap-1.5 bg-volt/15 rounded-full px-2.5 py-1 text-[11px] font-bold text-volt border border-volt/30"
                    title={new Date(a.unlocked_at).toLocaleDateString('pt-BR')}>
                    <span>{badge.emoji}</span>
                    <span>{badge.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* PRD §3.2 — Radar 8 eixos */}
        {radar && radar.length > 0 && (
          <div className="mb-3">
            <RadarChart8 data={radar} />
          </div>
        )}

        {/* PRD §3.3 — Personal Records */}
        {personalRecords && (
          <div className="mb-3">
            <PersonalRecords
              longestStreakDays={personalRecords.longest_streak_days}
              longestSessionMin={personalRecords.longest_session_min}
              longestSessionDate={personalRecords.longest_session_date}
              mostSubsWeek={personalRecords.most_subs_week}
              mostSubsWeekStart={personalRecords.most_subs_week_start}
              firstTrainingDate={personalRecords.first_training_date}
              mostActiveMonth={personalRecords.most_active_month}
              mostActiveMonthCount={personalRecords.most_active_month_count}
            />
          </div>
        )}

        {/* Next technique */}
        <NextTechniqueCard beltId={profile.belt_id} completions={completions} />

        {/* Activity Rings — Apple Fitness style weekly goals */}
        <div className="mb-3">
          <ActivityRings
            weekMinutes={weekMinutes}
            weekTrainings={weekTrains}
            currentStreak={streak}
          />
        </div>

        {/* Minutes bar chart — 30 days workload */}
        {sessions.length > 0 && (
          <div className="mb-3">
            <MinutesBarChart sessions={sessions} />
          </div>
        )}

        {/* Type breakdown */}
        {sessions.length >= 3 && (
          <div className="mb-3">
            <TypeBreakdown sessions={sessions} />
          </div>
        )}

        {/* PRD §3.3 — Heatmap YoY com toggle de ano */}
        <div className="mb-3">
          <HeatmapYoY attendance={attendance} trainingSessions={sessions} />
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
