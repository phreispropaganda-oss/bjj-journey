'use client'

import Link from 'next/link'

const TABS = [
  { href: '/feed',      label: 'Feed',     emoji: '🔥' },
  { href: '/desafios',  label: 'Desafios', emoji: '🎯' },
  { href: '/rankings',  label: 'Rankings', emoji: '🏆' },
]

export default function SocialTabs({ active }: { active: 'feed' | 'desafios' | 'rankings' }) {
  return (
    <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none bg-brand-surface border-b border-brand-elev">
      {TABS.map(t => {
        const isActive = `/${active}` === t.href
        return (
          <Link key={t.href} href={t.href}
            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-black transition-all min-h-tap ${
              isActive ? 'bg-blood text-ink-primary shadow-glow-blood' : 'bg-brand-elev text-ink-secondary'
            }`}>
            {t.emoji} {t.label}
          </Link>
        )
      })}
    </div>
  )
}
