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
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState('')

  async function handleCheckout(planKey: string) {
    if (planKey === 'free') return
    setLoadingPlan(planKey)
    setCheckoutError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, interval: annual ? 'annual' : 'monthly' }),
      })
      const { url, error } = await res.json()
      if (error) { setCheckoutError(error); return }
      if (url) { window.location.href = url; return }
      setCheckoutError('Pagamentos ainda não estão ativos. Em breve!')
    } catch {
      setCheckoutError('Erro ao iniciar checkout. Tente novamente.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F4F0] px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Escolha seu plano</h1>
        <p className="text-sm text-[#666]">Invista na sua jornada no tatame</p>
        <div className="flex items-center justify-center gap-3 mt-5">
          <span className={`text-sm font-medium ${!annual ? 'text-[#1A1A2E]' : 'text-[#AAA]'}`}>Mensal</span>
          <button onClick={() => setAnnual(a => !a)}
            className={`w-12 h-6 rounded-full transition-colors relative ${annual ? 'bg-[#FF6B2B]' : 'bg-[#DDD8D0]'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-[#1A1A2E]' : 'text-[#AAA]'}`}>
            Anual <span className="text-xs text-green-600 font-bold">−20%</span>
          </span>
        </div>
      </div>

      {checkoutError && (
        <p className="text-center text-sm text-red-500 mb-4 bg-red-50 py-2 px-4 rounded-xl max-w-sm mx-auto">{checkoutError}</p>
      )}

      <div className="space-y-4 max-w-sm mx-auto">
        {plans.map(plan => (
          <div key={plan.key} className={`rounded-2xl p-5 shadow-sm ${plan.highlight ? 'bg-[#FF6B2B] text-white' : 'bg-white'}`}>
            {plan.highlight && (
              <div className="text-[11px] font-bold uppercase tracking-wider bg-white/20 rounded-full px-3 py-0.5 inline-block mb-3">
                Mais popular
              </div>
            )}
            <div className="flex items-end justify-between mb-1">
              <h2 className={`text-xl font-bold ${plan.highlight ? 'text-white' : 'text-[#1A1A2E]'}`}>{plan.name}</h2>
              <div className="text-right">
                <span className="text-2xl font-bold">{formatPrice(annual ? plan.price.annual : plan.price.monthly)}</span>
                {plan.price.monthly > 0 && (
                  <span className={`text-xs ml-1 ${plan.highlight ? 'text-white/70' : 'text-[#666]'}`}>/{annual ? 'ano' : 'mês'}</span>
                )}
              </div>
            </div>
            <p className={`text-xs mb-4 ${plan.highlight ? 'text-white/80' : 'text-[#666]'}`}>{plan.description}</p>
            <ul className="space-y-2 mb-5">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check size={14} className={plan.highlight ? 'text-white' : 'text-green-500'} />
                  <span className={plan.highlight ? 'text-white' : 'text-[#1A1A2E]'}>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout(plan.key)}
              disabled={loadingPlan === plan.key}
              className={`w-full py-3 rounded-full font-bold text-sm transition-colors disabled:opacity-60 ${
                plan.highlight ? 'bg-white text-[#FF6B2B] hover:bg-white/90'
                : plan.key === 'free' ? 'border-2 border-[#DDD8D0] text-[#666] hover:border-[#FF6B2B] hover:text-[#FF6B2B]'
                : 'bg-[#FF6B2B] text-white hover:bg-[#E85A1A]'
              }`}>
              {loadingPlan === plan.key ? 'Aguarde...' : plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
