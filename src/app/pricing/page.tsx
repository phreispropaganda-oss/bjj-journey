'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

const plans = [
  {
    key: 'free', name: 'Gratuito', price: { monthly: 0, annual: 0 },
    description: 'Para começar sua jornada',
    features: ['Faixa branca e azul completas', 'Registro de presença', 'Progresso de técnicas', 'Perfil público básico'],
    cta: 'Começar grátis', highlight: false,
  },
  {
    key: 'pro', name: 'Pro', price: { monthly: 2900, annual: 27800 },
    description: 'Para praticantes dedicados',
    features: ['Todas as 5 faixas completas', 'Conquistas e badges', 'Compartilhamento estilo Strava', 'OG image dinâmica', 'Estatísticas avançadas', 'Modo foco (TDAH)'],
    cta: 'Assinar Pro', highlight: true,
  },
  {
    key: 'academy', name: 'Academia', price: { monthly: 9900, annual: 95000 },
    description: 'Para professores e academias',
    features: ['Tudo do Pro', 'Página da academia', 'Gestão de alunos', 'Relatórios de progresso', 'Suporte prioritário', 'Logo personalizado'],
    cta: 'Para academias', highlight: false,
  },
]

function formatPrice(cents: number) {
  if (cents === 0) return 'R$0'
  return `R$${(cents / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  async function handleCheckout(planKey: string) {
    if (planKey === 'free') return
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planKey, interval: annual ? 'annual' : 'monthly' }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  return (
    <div className="min-h-screen bg-[#F7F4F0] px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Escolha seu plano</h1>
        <p className="text-sm text-[#666]">Invista na sua jornada no tatame</p>
      </div>
    </div>
  )
}
