'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
} from './actions'

type Mode = 'signin' | 'signup' | 'magic'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(
    urlError === 'auth_failed' || urlError === 'oauth_failed'
      ? 'Erro na autenticação. Tente novamente.'
      : ''
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData()
    fd.append('email', email)
    if (mode !== 'magic') fd.append('password', password)

    let result: { error?: string; success?: boolean }
    if (mode === 'magic')      result = await signInWithMagicLink(fd)
    else if (mode === 'signup') result = await signUpWithPassword(fd)
    else                        result = await signInWithPassword(fd)

    setLoading(false)
    if (result.error) { setError(result.error); return }

    if (mode === 'signin') {
      router.push('/dashboard')
      router.refresh()
    } else {
      setSent(true)
    }
  }

  // ── Confirmation screen (signup or magic link sent) ──
  if (sent) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-6">📧</div>
          <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
            {mode === 'signup' ? 'Confirme seu email' : 'Verifique seu email'}
          </h2>
          <p className="text-[#999] text-sm leading-relaxed mb-2">
            Enviamos um link para <span className="text-white font-semibold">{email}</span>.
          </p>
          <p className="text-[#666] text-sm leading-relaxed">
            {mode === 'signup'
              ? 'Clique no link de confirmação para ativar sua conta.'
              : 'Clique para entrar no Belt Rise.'}
          </p>
          <button
            onClick={() => { setSent(false); setEmail(''); setPassword(''); setMode('signin') }}
            className="mt-8 text-[#CC0000] text-sm font-bold"
          >
            ← Voltar para login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Hero top */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-8 pt-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#CC0000] rounded-full opacity-10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-1/3 left-0 w-40 h-40 bg-[#CC0000] rounded-full opacity-5 -translate-x-1/2" />
        <div className="relative z-10 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-[#CC0000] rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/50">
              <span className="text-white font-black text-lg tracking-tighter">BR</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tight">Belt Rise</span>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight tracking-tight mb-2">
            DOMINE<br />
            <span className="text-[#CC0000]">O TATAME.</span>
          </h1>
          <p className="text-[#666] text-sm leading-relaxed">
            Técnicas, presença e evolução de faixa — tudo em um lugar.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-t-[32px] px-6 pt-6 pb-10">
        {/* Tabs */}
        <div className="flex bg-[#F2F0ED] rounded-full p-1 mb-5">
          {(['signin', 'signup'] as Mode[]).map(m => (
            <button key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 rounded-full text-sm font-black transition-all ${
                mode === m ? 'bg-[#CC0000] text-white shadow-md' : 'text-[#555]'
              }`}>
              {m === 'signin' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        {/* Google */}
        <a href="/api/auth/google"
          className="w-full flex items-center justify-center gap-3 border-2 border-[#E5E5E5] rounded-full py-3 font-bold text-sm text-[#0D0D0D] mb-4 hover:bg-[#F8F7F5] transition-colors">
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

        {/* Email + password form */}
        <form onSubmit={handleSubmit}>
          <label className="field-label">Email</label>
          <input
            type="email"
            className="field-input mb-3"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          {mode !== 'magic' && (
            <>
              <label className="field-label">Senha</label>
              <input
                type="password"
                className="field-input mb-1"
                placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                required
              />
              {mode === 'signin' && (
                <button type="button"
                  onClick={() => { setMode('magic'); setError('') }}
                  className="text-xs text-[#CC0000] font-bold mb-3">
                  Esqueci a senha — usar link mágico
                </button>
              )}
            </>
          )}

          {mode === 'magic' && (
            <div className="bg-[#FFF0F0] border border-[#FFCCCC] rounded-xl px-3 py-2 mb-3 text-xs text-[#CC0000]">
              ✨ Enviaremos um link de acesso para seu email. Sem senha necessária.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-3">
              <span className="text-red-500 text-lg flex-shrink-0">⚠️</span>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary disabled:opacity-50 mt-2">
            {loading
              ? 'Aguarde...'
              : mode === 'signup' ? 'Criar conta →'
              : mode === 'magic'  ? 'Enviar link mágico →'
              : 'Entrar →'}
          </button>
        </form>

        {/* Switch between modes */}
        {mode === 'magic' && (
          <button onClick={() => { setMode('signin'); setError('') }}
            className="w-full text-center text-xs text-[#AAA] font-bold mt-3">
            ← Voltar para login com senha
          </button>
        )}

        <p className="text-[11px] text-center text-[#BBB] mt-5 leading-relaxed">
          Ao {mode === 'signup' ? 'criar conta' : 'entrar'} você concorda com os{' '}
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
