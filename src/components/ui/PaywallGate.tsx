'use client'

import Link from 'next/link'

const BELT_COLOR: Record<string, string> = {
  white:'#E8E8E8', blue:'#2563EB', purple:'#7C3AED', brown:'#92400E', black:'#1A1A1A',
}
const BELT_NAME: Record<string, string> = {
  white:'Branca', blue:'Azul', purple:'Roxa', brown:'Marrom', black:'Preta',
}

export default function PaywallGate({ beltId }: { beltId: string }) {
  const color = BELT_COLOR[beltId] ?? '#555'
  const name  = BELT_NAME[beltId]  ?? beltId

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center bg-brand-bg">
      {/* Belt preview locked */}
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 relative"
        style={{ background: `${color}22`, border: `3px solid ${color}40` }}>
        <div className="w-10 h-6 rounded" style={{ background: color }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">🔒</span>
        </div>
      </div>

      <h2 className="text-2xl font-black text-ink-primary mb-2 tracking-tight">
        Faixa <span style={{ color }}>{ name}</span> bloqueada
      </h2>
      <p className="text-ink-secondary text-sm leading-relaxed mb-2 max-w-xs">
        No plano Gratuito você tem acesso completo à <strong>Faixa Branca</strong>.
      </p>
      <p className="text-[#999] text-sm mb-8 max-w-xs">
        Faça upgrade para o <strong className="text-rise">Pro</strong> e desbloqueie todas as 5 faixas — Branca, Azul, Roxa, Marrom e Preta.
      </p>

      {/* What you get */}
      <div className="w-full max-w-xs bg-brand-surface rounded-2xl p-4 shadow-sm mb-6 text-left">
        <p className="text-[11px] font-black uppercase tracking-wider text-ink-muted mb-3">Pro inclui</p>
        {[
          '🥋 Todas as 5 faixas completas',
          '📅 Controle de presença e streak',
          '🏅 Conquistas e badges',
          '📱 Perfil público compartilhável',
          '🧠 Modo foco (TDAH)',
        ].map(f => (
          <div key={f} className="flex items-center gap-2 py-1.5 border-b border-brand-elev last:border-none">
            <span className="text-sm">{f}</span>
          </div>
        ))}
      </div>

      {/* Pricing preview */}
      <div className="w-full max-w-xs grid grid-cols-2 gap-2 mb-6">
        <div className="bg-brand-surface rounded-2xl p-3 text-center border-2 border-brand-elev">
          <p className="text-lg font-black text-ink-primary">R$19</p>
          <p className="text-[11px] text-ink-muted">por mês</p>
        </div>
        <div className="bg-rise rounded-2xl p-3 text-center">
          <p className="text-lg font-black text-white">R$149</p>
          <p className="text-[11px] text-white/70">por ano (-35%)</p>
        </div>
      </div>

      <Link href="/pricing"
        className="w-full max-w-xs block text-center bg-rise text-white font-black py-4 rounded-full text-sm shadow-lg shadow-red-900/20 hover:bg-rise-deep transition-colors mb-3">
        Fazer upgrade para Pro →
      </Link>

      <Link href="/modules/white"
        className="text-sm text-ink-muted font-medium hover:text-ink-secondary transition-colors">
        Voltar para Faixa Branca (grátis)
      </Link>
    </div>
  )
}
