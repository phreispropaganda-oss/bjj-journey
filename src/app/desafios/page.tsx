import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/ui/BottomNav'
import SocialTabs from '@/components/feed/SocialTabs'

interface Challenge {
  id: string; title: string; description: string; emoji: string;
  metric: string; target: number; scope: string;
  starts_at: string; ends_at: string; active: boolean;
}

const METRIC_LABEL: Record<string, string> = {
  training_count:   'treinos',
  training_minutes: 'min',
  submissions:      'finalizações',
  streak_days:      'dias seguidos',
  technique_count:  'técnicas',
}

function daysLeft(endsAt: string): number {
  const end = new Date(endsAt)
  end.setHours(23, 59, 59, 999)
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000))
}

export default async function DesafiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: chsRaw } = await supabase
    .from('challenges').select('*').eq('active', true)
    .gte('ends_at', new Date().toISOString().split('T')[0])
    .order('ends_at')

  const challenges = (chsRaw ?? []) as Challenge[]

  // Compute progress for each challenge
  const progressMap: Record<string, number> = {}
  await Promise.all(
    challenges.map(async c => {
      const { data } = await (supabase as unknown as {
        rpc: (n: string, p: Record<string, string>) => Promise<{ data: number | null }>
      }).rpc('challenge_progress', { p_challenge_id: c.id, p_user_id: user.id })
      progressMap[c.id] = (data ?? 0) as number
    })
  )

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-rise rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-[10px] tracking-tighter">BR</span>
          </div>
          <h1 className="font-display text-base text-ink-primary">Desafios</h1>
        </div>
        <span className="text-xs text-ink-muted font-bold">{challenges.length} ativos</span>
      </div>
      <SocialTabs active="desafios" />

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pt-3 pb-24 space-y-3">
        {challenges.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">🎯</p>
            <p className="font-black text-ink-primary text-lg mb-1">Sem desafios ativos</p>
            <p className="text-ink-muted text-sm">Volte em breve para novos desafios mensais!</p>
          </div>
        ) : (
          challenges.map(c => {
            const progress = progressMap[c.id] ?? 0
            const pct = Math.min(100, Math.round((progress / c.target) * 100))
            const completed = progress >= c.target
            const left = daysLeft(c.ends_at)
            return (
              <div key={c.id}
                className={`rounded-2xl p-4 shadow-sm border-2 transition-all ${
                  completed
                    ? 'bg-volt/15 border-[#86EFAC]'
                    : 'bg-brand-elev border-transparent text-ink-primary'
                }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl ${
                    completed ? 'bg-[#16A34A]' : 'bg-rise/10'
                  }`}>
                    {c.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-ink-primary text-base leading-tight tracking-tight">
                      {c.title}
                      {completed && <span className="ml-2 text-volt-deep">✓</span>}
                    </p>
                    <p className="text-xs text-ink-secondary mt-0.5 leading-snug">{c.description}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className={`text-xs font-black ${completed ? 'text-volt-deep' : 'text-rise'}`}>
                      {progress.toLocaleString()} / {c.target.toLocaleString()} {METRIC_LABEL[c.metric] ?? ''}
                    </p>
                    <p className="text-[10px] font-bold text-ink-muted">{pct}%</p>
                  </div>
                  <div className="h-2 bg-brand-elev rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${completed ? 'bg-[#16A34A]' : 'bg-rise'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <p className="text-[11px] text-ink-muted font-medium">
                    {left > 0 ? `⏱ ${left} dia${left > 1 ? 's' : ''} restante${left > 1 ? 's' : ''}` : 'Encerrado'}
                  </p>
                  {completed && (
                    <span className="bg-[#16A34A] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Conquistado
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <BottomNav active="feed" />
    </div>
  )
}
