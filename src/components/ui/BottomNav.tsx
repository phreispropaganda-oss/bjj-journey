'use client'

import Link from 'next/link'

const NAV = [
  { id: 'dashboard', label: 'Início',   icon: '⌂',  href: '/dashboard' },
  { id: 'feed',      label: 'Feed',     icon: '🔥', href: '/feed' },
  { id: 'record',    label: '',         icon: '+',  href: '/treino/novo', center: true },
  { id: 'calendar',  label: 'Treinos',  icon: '📅', href: '/calendar' },
  { id: 'profile',   label: 'Perfil',   icon: '👤', href: '/profile' },
]

export default function BottomNav({ active }: { active: string }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto flex z-50 bg-brand-surface border-t border-brand-elev"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      {NAV.map(n => {
        const isActive = active === n.id
        if (n.center) {
          return (
            <Link key={n.id} href={n.href}
              className="flex-1 flex flex-col items-center justify-center py-1 min-h-tap">
              <div className="w-16 h-16 -mt-6 rounded-full bg-blood text-ink-primary font-display flex items-center justify-center text-3xl shadow-glow-blood active:scale-95 transition-transform">
                {n.icon}
              </div>
            </Link>
          )
        }
        return (
          <Link key={n.id} href={n.href}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all min-h-tap">
            <span className={`text-xl leading-none ${isActive ? '' : 'opacity-40'}`}>
              {n.icon}
            </span>
            <span className={`text-[10px] font-bold tracking-wide ${
              isActive ? 'text-blood' : 'text-ink-muted'
            }`}>
              {n.label}
            </span>
            {isActive && <div className="w-1 h-1 rounded-full bg-blood mt-0.5" />}
          </Link>
        )
      })}
    </nav>
  )
}
