import { createClient } from '@/lib/supabase/server'

interface XP {
  total_minutes: number; total_hours: number; current_level: number
  level_start_min: number; next_level_min: number
  minutes_in_level: number; minutes_to_next: number; level_progress_pct: number
}

export default async function LevelBadge({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { data } = await (supabase as unknown as {
    rpc: (n: string, p: Record<string, string>) => Promise<{ data: XP[] | null }>
  }).rpc('user_xp_progress', { p_user_id: userId })
  const xp = (data ?? [])[0]
  if (!xp) return null

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-elev p-3 flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-volt to-blood flex items-center justify-center text-brand-bg font-display text-xl">
        {xp.current_level}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-ink-muted font-bold">Nível</p>
        <p className="text-ink-primary font-bold text-sm">
          {xp.total_hours}h treinadas · faltam {Math.max(0, Math.round(xp.minutes_to_next / 60))}h
        </p>
        <div className="h-1.5 bg-brand-elev rounded-full overflow-hidden mt-1.5">
          <div className="h-full bg-volt rounded-full transition-all" style={{ width: `${xp.level_progress_pct}%` }} />
        </div>
      </div>
    </div>
  )
}
