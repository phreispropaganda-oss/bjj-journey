'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signInWithMagicLink } from './actions'

function LoginContent() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(
    urlError === 'auth_failed' || urlError === 'oauth_failed'
      ? 'Erro na autenticação. Tente novamente.'
      : ''
  )

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData()
    fd.append('email', email)
    const result = await signInWithMagicLink(fd)
    setLoading(false)
    if ('error' in result && result.error) setError(result.error)
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-6">📧</div>
          <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Verifique seu email</h2>
          <p className="text-[#999] text-sm leading-relaxed">
            Enviamos um link para <span className="text-white font-semibold">{email}</span>.
            Clique para entrar no Belt Rise.
          </p>
          <button
            onClick={() => { setSent(false); setEmail('') }}
            className="mt-8 text-[#CC0000] text-sm font-bold"
          >
            Usar outro email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Hero top — vermelho com tipografia bold */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-10 pt-16 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#CC0000] rounded-full opacity-10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-1/3 left-0 w-40 h-40 bg-[#CC0000] rounded-full opacity-5 -translate-x-1/2" />

        {/* Logo + tagline */}
        <div className="relative z-10 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#CC0000] rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/50">
              <span className="text-white font-black text-lg tracking-tighter">BR</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tight">Belt Rise</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-3">
            DOMINE<br />
            <span className="text-[#CC0000]">O TATAME.</span>
          </h1>
          <p className="text-[#666] text-sm leading-relaxed">
            Técnicas, presença e evolução de faixa — tudo em um lugar.
          </p>
        </div>
      </div>

      {/* Form card — branco sobre escuro */}
      <div className="bg-white rounded-t-[32px] px-6 pt-8 pb-10">
        <h2 className="text-xl font-black text-[#0D0D0D] mb-1 tracking-tight">Entrar</h2>
        <p className="text-[#999] text-sm mb-6">Crie sua conta ou acesse com um clique.</p>

        {/* Google */}
        <a
          href="/api/auth/google"
          className="w-full flex items-center justify-center gap-3 border-2 border-[#E5E5E5] rounded-full py-3.5 font-bold text-sm text-[#0D0D0D] mb-4 hover:bg-[#F8F7F5] transition-colors active:bg-[#F2F0ED]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </a>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[#E5E5E5]" />
          <span className="text-xs text-[#999] font-medium">ou</span>
          <div className="flex-1 h-px bg-[#E5E5E5]" />
        </div>

        <form onSubmit={handleMagicLink}>
          <label className="field-label">Email</label>
          <input
            type="email"
            className="field-input mb-4"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
              <span className="text-red-500 text-lg">⚠️</span>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar link mágico →'}
          </button>
        </form>

        <p className="text-[11px] text-center text-[#BBB] mt-5 leading-relaxed">
          Ao entrar você concorda com os{' '}
          <span className="text-[#CC0000] font-semibold">Termos de Uso</span> do Belt Rise.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0D0D]" />}>
      <LoginContent />
    </Suspense>
  )
}
