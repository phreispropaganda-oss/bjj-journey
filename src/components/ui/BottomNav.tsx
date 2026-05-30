'use client'

import Link from 'next/link'

const NAV = [
  { id: 'record',    label: 'Treino',    icon: '🥊', href: '/treino/novo' },
  { id: 'progress',  label: 'Progresso', icon: '📈', href: '/dashboard' },
  { id: 'community', label: 'Comunidade',icon: '👥', href: '/feed' },
  { id: 'desafios',  label: 'Desafios',  icon: '🎯', href: '/desafios' },
]

export default function BottomNav({ active }: { active: string }) {
  // Map legacy ids para os 4 tabs
  const aliasMap: Record<string, string> = {
    dashboard: 'progress', calendar: 'progress',
    feed: 'community',
    profile: 'progress',
  }
  const current = aliasMap[active] ?? active

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto flex z-50 bg-brand-surface border-t border-brand-elev"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      {NAV.map(n => {
        const isActive = current === n.id
        return (
          <Link key={n.id} href={n.href}
            className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-all min-h-tap">
            <span className={`text-xl leading-none transition-opacity ${isActive ? '' : 'opacity-50'}`}>
              {n.icon}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              isActive ? 'text-rise' : 'text-ink-muted'
            }`}>
              {n.label}
            </span>
            {isActive && <div className="w-6 h-0.5 rounded-full bg-rise mt-0.5" />}
          </Link>
        )
      })}
    </nav>
  )
}
