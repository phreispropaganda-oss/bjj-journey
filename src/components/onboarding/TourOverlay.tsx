'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

const STEPS = [
  {
    emoji: '🥋',
    title: 'Registre cada treino',
    body: 'Toque em + na barra de baixo para abrir o registro. Pode usar voz, fotos e técnicas inteligentes.',
    cta: { href: '/treino/novo', label: 'Tentar registrar' },
  },
  {
    emoji: '📊',
    title: 'Acompanhe sua evolução',
    body: 'Seu dashboard mostra streak, level, radar 8 eixos e records. Volte sempre que precisar de motivação.',
    cta: { href: '/dashboard', label: 'Abrir dashboard' },
  },
  {
    emoji: '👤',
    title: 'Sua vitrine pessoal',
    body: 'O perfil traz seus destaques, timeline e posts. Compartilhe sua jornada com o mundo.',
    cta: { href: '/profile', label: 'Ver perfil' },
  },
  {
    emoji: '🏆',
    title: 'Desbloqueie conquistas',
    body: 'Cada marco vira badge: 10º, 50º, 100º treino, streak 30/90, ano ativo, faixa verificada.',
    cta: { href: '/dashboard', label: 'Ver badges' },
  },
  {
    emoji: '📸',
    title: 'Compartilhe momentos',
    body: 'Crie stories estilo Instagram com 7 templates: Clássico, Hype, Stats, Recorde e mais.',
    cta: { href: '/wrapped', label: 'Ver Wrapped' },
  },
]

// Mudei a chave (era michi_tour_v1) para o tour reaparecer apos o rebrand Belt Rise
const STORAGE_KEY = 'belt_rise_tour_v2'

export default function TourOverlay() {
  const [step, setStep] = useState(0)
  const [show, setShow] = useState(false)
  useBodyScrollLock(show)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(STORAGE_KEY)) setShow(true)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    setShow(false)
  }

  if (!show) return null
  const s = STEPS[step]

  return (
    <div className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center px-5 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && dismiss()}>
      <div className="bg-brand-surface w-full max-w-sm rounded-3xl p-6 border border-brand-elev"
        style={{ animation: 'fadeUp 0.3s ease' }}>
        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${
              i === step ? 'w-8 bg-volt' : i < step ? 'w-2 bg-volt/40' : 'w-2 bg-brand-elev'
            }`} />
          ))}
        </div>

        <div className="text-center">
          <p className="text-6xl mb-4">{s.emoji}</p>
          <h2 className="font-display text-ink-primary text-2xl mb-2">{s.title}</h2>
          <p className="text-ink-secondary text-sm leading-relaxed mb-6">{s.body}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Link href={s.cta.href} onClick={dismiss}
            className="btn-primary text-center">
            {s.cta.label}
          </Link>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 bg-brand-elev text-ink-secondary font-black py-2.5 rounded-full text-xs">
                ← Voltar
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="flex-1 bg-brand-elev text-ink-primary font-black py-2.5 rounded-full text-xs">
                Próximo →
              </button>
            ) : (
              <button onClick={dismiss}
                className="flex-1 bg-volt text-brand-bg font-black py-2.5 rounded-full text-xs">
                Começar
              </button>
            )}
          </div>
          <button onClick={dismiss} className="text-ink-muted text-[10px] uppercase tracking-wider font-bold mt-1">
            Pular tour
          </button>
        </div>
      </div>
    </div>
  )
}
