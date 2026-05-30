import { createClient } from '@/lib/supabase/server'

interface Event {
  kind: 'belt' | 'achievement' | 'milestone'
  title: string
  subtitle: string
  icon: string
  occurred_at: string
}

const ACCENT: Record<Event['kind'], string> = {
  belt:        'border-volt bg-volt/10',
  achievement: 'border-blood bg-blood/10',
  milestone:   'border-brand-elev bg-brand-surface',
}

export default async function ProfileTimeline({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { data } = await (supabase as unknown as {
    rpc: (n: string, p: Record<string, string>) => Promise<{ data: Event[] | null }>
  }).rpc('user_timeline', { p_uid: userId })
  const events = (data ?? []) as Event[]

  if (events.length === 0) {
    return (
      <div className="card-elev text-center py-8">
        <p className="text-4xl mb-2">🎬</p>
        <p className="font-display text-ink-primary mb-1">Sua história começa aqui</p>
        <p className="text-sm text-ink-secondary">
          Registre treinos, conquiste badges e verifique sua faixa para popular sua timeline.
        </p>
      </div>
    )
  }

  return (
    <div className="relative pl-8 pr-2">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-brand-elev" />
      {events.map((e, i) => (
        <div key={i} className="relative pb-4 last:pb-0">
          <div className={`absolute -left-[26px] top-2 w-6 h-6 rounded-full flex items-center justify-center text-sm border-2 ${ACCENT[e.kind]}`}>
            {e.icon}
          </div>
          <div className="bg-brand-surface rounded-xl border border-brand-elev px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-ink-primary font-bold text-sm capitalize flex-1">{e.title}</p>
              <p className="text-[10px] text-ink-muted whitespace-nowrap mt-0.5">
                {new Date(e.occurred_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <p className="text-xs text-ink-secondary mt-0.5">{e.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
