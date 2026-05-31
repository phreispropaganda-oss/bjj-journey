'use client'

import { useTheme, type ThemeMode } from './ThemeProvider'

const OPTIONS: { value: ThemeMode; icon: string; label: string }[] = [
  { value: 'light',  icon: '☀️', label: 'Claro' },
  { value: 'dark',   icon: '🌙', label: 'Escuro' },
  { value: 'system', icon: '⚙️', label: 'Sistema' },
]

export default function ThemeToggle() {
  const { mode, setMode } = useTheme()
  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-elev p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-2">Tema</p>
      <div className="grid grid-cols-3 gap-1.5">
        {OPTIONS.map(o => (
          <button key={o.value}
            onClick={() => setMode(o.value)}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all min-h-tap ${
              mode === o.value
                ? 'bg-rise/15 border-rise text-rise'
                : 'border-transparent text-ink-secondary hover:bg-brand-hover'
            }`}>
            <span className="text-xl leading-none">{o.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-wider">{o.label}</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-ink-muted mt-2 text-center">
        {mode === 'system' ? 'Segue a configuração do celular' : `Tema ${mode === 'light' ? 'claro' : 'escuro'} fixo`}
      </p>
    </div>
  )
}
