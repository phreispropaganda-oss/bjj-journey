'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { BELTS } from '@/lib/curriculum'
import { generateStoryImage, shareToInstagramStories } from '@/lib/storyImage'

interface Stats {
  total_sessions: number
  total_minutes: number
  total_calories: number
  total_subs_for: number
  total_subs_against: number
  total_rolls: number
  longest_streak: number
  longest_session: number
  busiest_month: number
  busiest_month_min: number
  top_modality: string
  top_modality_min: number
  top_techniques: { tag: string; count: number }[]
  level_end: number
  first_session_at: string | null
  last_session_at: string | null
}

interface Props {
  year: number
  stats: Stats
  profile: { name: string; username: string; beltId: string; avatarUrl: string | null; degrees: number }
}

const MONTHS = ['', 'Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MOD_LABEL: Record<string, { emoji: string; label: string }> = {
  bjj:       { emoji: '🥋', label: 'Jiu-Jitsu' },
  muay_thai: { emoji: '🥊', label: 'Muay Thai' },
  boxe:      { emoji: '🥊', label: 'Boxe' },
  judo:      { emoji: '🥋', label: 'Judô' },
}

export default function WrappedClient({ year, stats, profile }: Props) {
  const [slide, setSlide] = useState(0)
  const [sharing, setSharing] = useState(false)
  const startX = useRef(0)
  const belt = BELTS.find(b => b.id === profile.beltId) ?? BELTS[0]
  const mod = MOD_LABEL[stats.top_modality] ?? MOD_LABEL.bjj
  const hours = Math.floor(stats.total_minutes / 60)
  const minRem = stats.total_minutes % 60

  const slides: { bg: string; render: () => React.ReactNode }[] = [
    // 1 — Intro
    {
      bg: 'linear-gradient(180deg, #080808 0%, #1A0006 60%, #9E0B13 100%)',
      render: () => (
        <div className="text-center px-6">
          <p className="text-7xl mb-4 animate-bounce-slow">道</p>
          <p className="font-display text-rise text-xs tracking-[0.4em] mb-2">BELT RISE WRAPPED</p>
          <p className="font-display text-ink-primary text-6xl mb-2">{year}</p>
          <p className="text-ink-secondary text-base mb-6">{profile.name}, sua jornada em <strong className="text-volt">{year}</strong>.</p>
          <p className="text-[10px] text-ink-muted">Toque para começar →</p>
        </div>
      ),
    },
    // 2 — Total hours
    {
      bg: 'linear-gradient(180deg, #080808 0%, #121212 100%)',
      render: () => (
        <div className="text-center px-6">
          <p className="text-ink-secondary text-sm mb-3">Você passou</p>
          <p className="font-display text-volt text-[160px] leading-none">{hours}</p>
          <p className="text-ink-primary text-3xl font-display -mt-3 mb-4">horas no tatame</p>
          <p className="text-ink-secondary text-sm">
            em <strong className="text-ink-primary">{stats.total_sessions}</strong> treinos
            {minRem > 0 && ` (+${minRem}min)`}
          </p>
        </div>
      ),
    },
    // 3 — Calories burnt
    {
      bg: 'radial-gradient(circle at 50% 40%, #9E0B13 0%, #080808 70%)',
      render: () => (
        <div className="text-center px-6">
          <p className="text-blood text-sm font-black uppercase tracking-wider mb-2">🔥 Queimadas</p>
          <p className="font-display text-ink-primary text-[140px] leading-none">{stats.total_calories.toLocaleString('pt-BR')}</p>
          <p className="text-ink-secondary text-2xl font-display mt-2">kcal totais</p>
          <p className="text-xs text-ink-muted mt-6">
            ≈ {Math.round(stats.total_calories / 7700)} kg de gordura derretida
          </p>
        </div>
      ),
    },
    // 4 — Modality + busiest month
    {
      bg: 'linear-gradient(180deg, #121212 0%, #1A2008 100%)',
      render: () => (
        <div className="text-center px-6">
          <p className="text-7xl mb-4">{mod.emoji}</p>
          <p className="text-ink-secondary text-sm mb-1">Sua modalidade do ano</p>
          <p className="font-display text-volt text-5xl mb-6">{mod.label}</p>
          <div className="bg-brand-surface/60 backdrop-blur rounded-2xl border border-brand-elev px-5 py-4 inline-block">
            <p className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">Mês mais forte</p>
            <p className="font-display text-ink-primary text-3xl">{MONTHS[stats.busiest_month] || '—'}</p>
            <p className="text-ink-secondary text-xs mt-1">{Math.floor(stats.busiest_month_min/60)}h treinadas</p>
          </div>
        </div>
      ),
    },
    // 5 — Combat (subs + streak)
    {
      bg: 'linear-gradient(180deg, #080808 0%, #1A0006 100%)',
      render: () => (
        <div className="text-center px-6 w-full">
          <p className="text-ink-secondary text-sm mb-6">⚔️ Seu combate em números</p>
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="bg-brand-surface/80 rounded-2xl py-5 border border-brand-elev">
              <p className="font-display text-volt text-5xl">{stats.total_subs_for}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider mt-1">Finalizei</p>
            </div>
            <div className="bg-brand-surface/80 rounded-2xl py-5 border border-brand-elev">
              <p className="font-display text-blood text-5xl">{stats.total_subs_against}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider mt-1">Sofridos</p>
            </div>
            <div className="bg-brand-surface/80 rounded-2xl py-5 border border-brand-elev">
              <p className="font-display text-ink-primary text-5xl">{stats.total_rolls}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider mt-1">Rolas</p>
            </div>
            <div className="bg-brand-surface/80 rounded-2xl py-5 border border-brand-elev">
              <p className="font-display text-ink-primary text-5xl">🔥{stats.longest_streak}</p>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider mt-1">Streak máx</p>
            </div>
          </div>
        </div>
      ),
    },
    // 6 — Top techniques
    {
      bg: 'linear-gradient(180deg, #121212 0%, #080808 100%)',
      render: () => (
        <div className="px-6 w-full text-center">
          <p className="text-ink-secondary text-sm mb-4">🧠 Suas técnicas favoritas</p>
          {stats.top_techniques.length === 0 ? (
            <p className="text-ink-muted text-sm">Sem técnicas marcadas em {year}</p>
          ) : (
            <ol className="space-y-2 max-w-sm mx-auto">
              {stats.top_techniques.slice(0, 5).map((t, i) => (
                <li key={t.tag} className="flex items-center bg-brand-surface/80 rounded-xl px-4 py-3 border border-brand-elev">
                  <span className="font-display text-blood text-2xl w-10 text-left">#{i+1}</span>
                  <span className="text-ink-primary font-bold flex-1 text-left">{t.tag}</span>
                  <span className="text-ink-secondary text-xs">{t.count}x</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ),
    },
    // 7 — Outro / share
    {
      bg: 'linear-gradient(180deg, #9E0B13 0%, #080808 70%)',
      render: () => (
        <div className="text-center px-6 w-full">
          <p className="text-6xl mb-3">道</p>
          <p className="font-display text-ink-primary text-4xl mb-2">VOCÊ É IMPARÁVEL.</p>
          <div className="flex items-center justify-center gap-2 mb-6 mt-3">
            <div className="w-6 h-3 rounded-sm border border-white/20" style={{ background: belt.color }} />
            <p className="text-ink-secondary text-sm">Faixa {belt.name} · @{profile.username}</p>
          </div>
          <button onClick={share} disabled={sharing}
            className="btn-primary w-full max-w-xs mx-auto disabled:opacity-60">
            {sharing ? 'Gerando imagem...' : '📸 Compartilhar nos Stories'}
          </button>
          <Link href="/dashboard" className="block text-ink-muted text-xs mt-4 underline">
            Voltar ao dashboard
          </Link>
        </div>
      ),
    },
  ]

  async function share() {
    setSharing(true)
    try {
      const blob = await generateStoryImage({
        authorName:    profile.name,
        authorInitial: profile.name.charAt(0).toUpperCase(),
        avatarUrl:     profile.avatarUrl,
        beltColor:     belt.color,
        beltName:      belt.name,
        degrees:       profile.degrees,
        typeEmoji:     '🎬',
        typeLabel:     `Wrapped ${year}`,
        durationMin:   stats.total_minutes,
        calories:      stats.total_calories,
        rolls:         stats.total_rolls,
        subsFor:       stats.total_subs_for,
        subsAgainst:   stats.total_subs_against,
        feeling:       null,
        techniques:    stats.top_techniques.slice(0,4).map(t => t.tag),
        photoUrl:      null,
        appUrl:        '',
        username:      profile.username,
        template:      'stats',
      })
      const r = await shareToInstagramStories(blob, `belt-rise-wrapped-${year}.jpg`)
      if (r.downloaded) alert('Imagem baixada! Abra Instagram > Stories para postar.')
    } catch (e) {
      alert('Erro ao gerar: ' + (e as Error).message)
    } finally {
      setSharing(false)
    }
  }

  function next() { setSlide(s => Math.min(slides.length - 1, s + 1)) }
  function prev() { setSlide(s => Math.max(0, s - 1)) }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="fixed inset-0 bg-brand-bg overflow-hidden touch-none"
      style={{ background: slides[slide].bg, transition: 'background 0.6s ease' }}
      onTouchStart={e => { startX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - startX.current
        if (dx < -50) next()
        else if (dx > 50) prev()
        else {
          const half = window.innerWidth / 2
          if (e.changedTouches[0].clientX > half) next(); else prev()
        }
      }}>

      {/* Top progress */}
      <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full bg-white/15 overflow-hidden">
            <div className="h-full bg-white transition-all duration-300"
              style={{ width: i < slide ? '100%' : i === slide ? '100%' : '0%' }} />
          </div>
        ))}
      </div>

      <Link href="/dashboard" className="absolute top-6 right-4 text-ink-primary/70 text-xl z-20 min-h-tap min-w-tap flex items-center justify-center">✕</Link>

      {/* Slide content */}
      <div key={slide} className="absolute inset-0 flex items-center justify-center animate-fade-in">
        {slides[slide].render()}
      </div>

      <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-white/30 z-20">
        belt-rise.app · {year} Wrapped
      </div>
    </div>
  )
}
