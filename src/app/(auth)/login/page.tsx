'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signInWithMagicLink, signInWithGoogle } from './actions'

function LoginPageContent() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(
    urlError === 'auth_failed' ? 'Erro na autenticação. Tente novamente.' : ''
  )

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData()
    fd.append('email', email)
    const result = await signInWithMagicLink(fd)
    setLoading(false)
    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5EE] to-[#F7F4F0] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[#FF6B2B] flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold shadow-lg">
            🥋
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">BJJ Journey</h1>
          <p className="text-sm text-[#666] mt-1">Sua jornada no jiu-jitsu começa aqui</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="text-4xl mb-3">📧</div>
            <h2 className="font-bold text-lg mb-2">Verifique seu email</h2>
            <p className="text-sm text-[#666]">
              Enviamos um link mágico para <strong>{email}</strong>. Clique no link para entrar.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-5">Entrar</h2>

            <button
              type="button"
              disabled={googleLoading}
              onClick={async () => {
                setGoogleLoading(true)
                setError('')
                const result = await signInWithGoogle()
                if (result && 'error' in result) {
                  setError(result.error ?? 'Erro ao conectar com Google.')
                  setGoogleLoading(false)
                }
                // On success, signInWithGoogle calls redirect() — no return needed
              }}
              className="w-full flex items-center justify-center gap-3 border-[1.5px] border-[#DDD8D0] rounded-full py-3 font-semibold text-sm mb-4 hover:bg-[#F7F4F0] transition-colors disabled:opacity-60"
            >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleLoading ? 'Redirecionando...' : 'Continuar com Google'}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#E8E3DC]" />
              <span className="text-xs text-[#AAA] font-medium">ou</span>
              <div className="flex-1 h-px bg-[#E8E3DC]" />
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
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
                {loading ? 'Enviando...' : 'Enviar link mágico ✨'}
              </button>
            </form>
          </div>
        )}

        <p className="text-xs text-center text-[#AAA] mt-6">
          Ao entrar, você concorda com os nossos Termos de Uso.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}
