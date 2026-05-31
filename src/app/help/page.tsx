'use client'

import { useState } from 'react'
import Link from 'next/link'

const SECTIONS = [
  {
    emoji: '🥋',
    title: 'Como registrar treinos',
    body: [
      'Toque em **+** na barra inferior para abrir o formulário.',
      'Você pode usar voz (botão 🎙️ no campo de nota), tirar foto direto, ou marcar técnicas com chips inteligentes.',
      'Visibilidade: **Público** aparece no feed global, **Seguidores** só para quem te segue, **Privado** só você vê.',
    ],
  },
  {
    emoji: '🏆',
    title: 'Como ganhar conquistas',
    body: [
      'Existem 8 badges automáticos: primeiro treino, 10/50/100 treinos, 30/90 dias de streak, 1 ano ativo, faixa verificada.',
      'Eles são desbloqueados em tempo real quando você atinge o marco.',
      'Aparecem no seu perfil em "Jornada" e podem ser compartilhados como Stories.',
    ],
  },
  {
    emoji: '📈',
    title: 'Como acompanhar evolução',
    body: [
      '**Dashboard**: streak hero, level XP, radar 8 eixos (BJJ), records pessoais.',
      '**Calendário**: heatmap com 4 níveis de intensidade. Toque num dia para ver os treinos.',
      '**Wrapped** (`/wrapped`): retrospectiva anual em 7 slides estilo Stories.',
    ],
  },
  {
    emoji: '📸',
    title: 'Como compartilhar resultados',
    body: [
      'Após registrar um treino, você é levado para a tela de compartilhamento.',
      '**7 templates** de Stories disponíveis: Clássico, Minimal, Hype, Stats, Conquista, Graduação, Recorde.',
      'A imagem 9:16 (1080×1920) é gerada no seu próprio dispositivo — sem custo de servidor.',
    ],
  },
  {
    emoji: '✅',
    title: 'Como registrar graduações',
    body: [
      'Vá em `/graduacao` e preencha o pedido: faixa, graus, academia, professor responsável e foto/PDF do diploma.',
      'Seu professor (ou admin de academia) recebe o pedido em `/graduacao/revisar` e aprova ou rejeita.',
      'Após aprovado, sua faixa ganha um selo **✓** verde no perfil público.',
    ],
  },
]

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/profile" className="text-ink-muted text-sm">← Perfil</Link>
        <h1 className="font-display text-base text-ink-primary flex-1">Central de Ajuda</h1>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto pb-10 space-y-2">
        {SECTIONS.map((s, i) => (
          <div key={i} className="bg-brand-surface rounded-2xl border border-brand-elev overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-brand-elev/40 transition-colors min-h-tap">
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-ink-primary font-bold text-sm flex-1 text-left">{s.title}</span>
              <span className={`text-ink-muted transition-transform ${open === i ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {open === i && (
              <div className="px-4 pb-4 space-y-2">
                {s.body.map((p, j) => (
                  <p key={j} className="text-sm text-ink-secondary leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: p
                        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-ink-primary">$1</strong>')
                        .replace(/`(.+?)`/g, '<code class="bg-brand-bg px-1.5 py-0.5 rounded text-xs text-volt">$1</code>'),
                    }} />
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="card-elev text-center mt-4">
          <p className="text-2xl mb-1">💬</p>
          <p className="text-sm text-ink-secondary">Não achou sua resposta?</p>
          <a href="mailto:suporte@belt-rise.app" className="text-rise font-bold text-sm">suporte@belt-rise.app</a>
        </div>
      </div>
    </div>
  )
}
