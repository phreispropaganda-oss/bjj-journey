import Link from 'next/link'

export default function SucessoPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
      <div className="card-elev max-w-md text-center py-10">
        <p className="text-6xl mb-3">🎉</p>
        <h1 className="font-display text-3xl text-ink-primary mb-2">Bem-vindo ao Pro!</h1>
        <p className="text-ink-secondary text-sm mb-6">
          Sua assinatura está ativa. Você tem 14 dias de trial — cancele a qualquer momento sem cobrança.
        </p>
        <Link href="/dashboard" className="btn-primary inline-block">Ir para dashboard</Link>
      </div>
    </div>
  )
}
