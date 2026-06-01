'use client'

import { useState } from 'react'

interface Props { username: string; appUrl: string }

export default function ShareButton({ username, appUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const url = `${appUrl}/profile/${username}`

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function whatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Veja minha jornada no jiu-jitsu no Belt Rise! 🥋\n${url}`)}`, '_blank')
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ title: 'Minha jornada no Belt Rise', url })
    } else {
      copy()
    }
  }

  return (
    <div className="space-y-3">
      {/* URL preview */}
      <div className="flex items-center gap-2 bg-brand-elev rounded-xl px-3 py-2">
        <p className="flex-1 text-xs text-ink-secondary truncate">{url}</p>
        <button onClick={copy} className="text-rise flex-shrink-0">
          {copied ? '✓' : '📋'}
        </button>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2">
        <button onClick={copy}
          className="flex-1 flex items-center justify-center gap-1.5 border-2 border-brand-elev rounded-full py-2.5 text-sm font-bold text-ink-secondary hover:border-rise hover:text-rise transition-colors">
          {copied ? '✓ Copiado!' : '🔗 Copiar link'}
        </button>
        <button onClick={whatsapp}
          className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white rounded-full py-2.5 text-sm font-bold hover:bg-green-600 transition-colors">
          📱 WhatsApp
        </button>
        <button onClick={nativeShare}
          className="px-3 flex items-center justify-center bg-rise text-white rounded-full hover:bg-rise-deep transition-colors">
          ↗
        </button>
      </div>
    </div>
  )
}
