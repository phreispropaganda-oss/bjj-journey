'use client'

import Link from 'next/link'

interface Props {
  active: string
  username?: string
}

export default function BottomNav({ active, username }: Props) {
  // 5 tabs estilo Strava
  const NAV = [
    { id: 'dashboard', label: 'Progresso',  icon: '📊', href: '/dashboard' },
    { id: 'feed',      label: 'Feed',       icon: '🔥', href: '/feed' },
    { id: 'record',    label: '',           icon: '+',  href: '/treino/novo', center: true },
    { id: 'calendar',  label: 'Calendário', icon: '📅', href: '/calendar' },
    { id: 'profile',   label: 'Perfil',     icon: '👤', href: username ? `/profile/${username}` : '/profile' },
  ]

  // Aliases legacy
  const aliasMap: Record<string, string> = {
    record: 'record', novo: 'record', share: 'record',
    progress: 'dashboard', community: 'feed', desafios: 'feed',
    settings: 'profile', edit: 'profile',
  }
  const current = aliasMap[active] ?? active

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto flex z-50 bg-brand-surface border-t border-brand-elev"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      {NAV.map(n => {
        const isActive = current === n.id
        if (n.center) {
          return (
            <Link key={n.id} href={n.href}
              className="flex-1 flex flex-col items-center justify-center py-1 min-h-tap relative">
              <div className="w-16 h-16 -mt-7 rounded-full bg-rise text-ink-primary font-display flex items-center justify-center text-3xl shadow-glow-rise active:scale-95 transition-transform border-4 border-brand-surface">
                {n.icon}
              </div>
            </Link>
          )
        }
        return (
          <Link key={n.id} href={n.href}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all min-h-tap">
            <span className={`text-xl leading-none transition-opacity ${isActive ? '' : 'opacity-45'}`}>
              {n.icon}
            </span>
            <span className={`text-[10px] font-black tracking-wide ${
              isActive ? 'text-rise' : 'text-ink-muted'
            }`}>
              {n.label}
            </span>
            {isActive && <div className="w-5 h-0.5 rounded-full bg-rise mt-0.5" />}
          </Link>
        )
      })}
    </nav>
  )
}
