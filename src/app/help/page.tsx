'use client'

import { useState } from 'react'
import Link from 'next/link'

const FAQ = [
  {
    q: 'Como registro um treino?',
    a: 'Toque no botão + central da barra inferior. Preencha tipo, duração e técnicas. Pode adicionar foto e nota por voz.',
  },
  {
    q: 'Como ganho conquistas?',
    a: 'Conquistas (badges) são desbloqueadas automaticamente: 1º treino, 10/50/100 treinos, 30/90 dias de streak, 1 ano ativo, faixa verificada.',
  },
  {
    q: 'Como faço check-in na academia?',
    a: 'Vá em "📍 Check-in" no Dashboard. Selecione a modalidade — buscamos academias em 3km do seu GPS. Se não achar, busca manual ou cadastre uma nova.',
  },
  {
    q: 'Como verifico minha faixa?',
    a: 'No menu (canto superior do perfil), vá em "Verificar graduação". Envie foto/PDF do diploma ou cerimônia. Seu professor (ou admin) revisa.',
  },
  {
    q: 'Como compartilho um treino?',
    a: 'Após salvar, na tela "Treino salvo!" escolha um dos 3 templates (Clássico, Hype, Recorde) e toque em "📤 COMPARTILHAR". Abre o menu com Story IG / Feed IG / TikTok / WhatsApp / Copiar link.',
  },
  {
    q: 'Posso apagar um treino?',
    a: 'Sim — na tela do treino, role até "Gestão do treino" e toque em 🗑️ Apagar. Pede confirmação.',
  },
  {
    q: 'Como mudar para modo claro?',
    a: 'No menu do perfil, escolha entre Claro / Escuro / Sistema (segue o celular).',
  },
]

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/profile/menu" className="text-ink-muted text-sm">← Menu</Link>
        <h1 className="font-display text-base text-ink-primary flex-1">FAQ</h1>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto pb-10 space-y-2">
        {FAQ.map((item, i) => (
          <div key={i} className="bg-brand-surface rounded-2xl border border-brand-elev overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-elev/40 transition-colors min-h-tap">
              <span className="text-ink-primary font-bold text-sm flex-1 text-left">{item.q}</span>
              <span className={`text-ink-muted transition-transform text-xs ${open === i ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {open === i && (
              <div className="px-4 pb-4">
                <p className="text-sm text-ink-secondary leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        ))}

        <div className="bg-brand-surface rounded-2xl border border-brand-elev p-4 text-center mt-4">
          <p className="text-2xl mb-1">💬</p>
          <p className="text-sm text-ink-secondary">Não achou sua resposta?</p>
          <a href="mailto:suporte@belt-rise.app" className="text-rise font-bold text-sm">suporte@belt-rise.app</a>
        </div>
      </div>
    </div>
  )
}
