'use client'

import { useState } from 'react'
import { openTikTokAppForShare } from '@/lib/social/tiktok'

interface Props {
  open: boolean
  onClose: () => void
  imageBlob: Blob | null
  caption: string
  profileUrl: string
  filename?: string
  /** Status conexao mostrado nos botoes IG/TikTok */
  connections?: {
    instagram?: 'connected' | 'disconnected'
    tiktok?:    'connected' | 'disconnected'
  }
}

export default function ShareSheet({
  open, onClose, imageBlob, caption, profileUrl, filename = 'michi.jpg', connections,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  if (!open) return null

  const previewUrl = imageBlob ? URL.createObjectURL(imageBlob) : null

  async function shareViaNative(): Promise<boolean> {
    if (!imageBlob) return false
    if (typeof navigator === 'undefined' || !navigator.canShare) return false
    const file = new File([imageBlob], filename, { type: imageBlob.type })
    if (!navigator.canShare({ files: [file] })) return false
    try {
      await navigator.share({ files: [file], text: caption, title: 'MICHI' })
      return true
    } catch (err) {
      if ((err as Error).name === 'AbortError') return true
      return false
    }
  }

  function downloadBlob() {
    if (!imageBlob) return
    const url = URL.createObjectURL(imageBlob)
    const a = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function shareInstagramStory() {
    setBusy('instagram'); setFeedback('')
    const native = await shareViaNative()
    if (!native) downloadBlob()
    setBusy(null)
    setFeedback('Imagem 9:16 salva! Abra Instagram → Stories → use a foto.')
  }

  async function shareInstagramFeed() {
    setBusy('instagram_feed')
    const native = await shareViaNative()
    if (!native) downloadBlob()
    setBusy(null)
    setFeedback('Imagem salva! Abra Instagram → + → Foto.')
  }

  async function shareTikTok() {
    setBusy('tiktok')
    downloadBlob()
    openTikTokAppForShare()
    setBusy(null)
    setFeedback('Imagem salva. O TikTok foi aberto — selecione a foto da galeria.')
  }

  function shareWhatsApp() {
    const text = `${caption}\n\n${profileUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  async function copyLink() {
    await navigator.clipboard.writeText(profileUrl)
    setFeedback('✓ Link copiado')
    setTimeout(() => setFeedback(''), 2000)
  }

  function igButton() {
    if (connections?.instagram === 'connected') {
      return null // Conectado: usar publish API via servidor (futuramente)
    }
    if (connections?.instagram === 'disconnected') {
      return (
        <a href="/api/social/instagram/connect"
          className="text-[10px] text-volt font-bold mt-0.5 block">
          Conectar Instagram (auto-post)
        </a>
      )
    }
    return null
  }

  function ttButton() {
    if (connections?.tiktok === 'disconnected') {
      return (
        <a href="/api/social/tiktok/connect"
          className="text-[10px] text-volt font-bold mt-0.5 block">
          Conectar TikTok (auto-post)
        </a>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-end backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-brand-surface w-full max-w-[480px] mx-auto rounded-t-3xl p-5 border-t border-brand-elev max-h-[90vh] overflow-y-auto"
        style={{ animation: 'fadeUp 0.25s ease' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-base text-ink-primary">Compartilhar</p>
          <button onClick={onClose} className="text-ink-muted text-xl min-h-tap min-w-tap">✕</button>
        </div>

        {previewUrl && (
          <div className="bg-brand-bg rounded-2xl p-3 mb-4 border border-brand-elev">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="mx-auto rounded-xl max-h-64 object-contain" />
          </div>
        )}

        {feedback && (
          <div className="bg-volt/15 border border-volt/30 text-volt px-3 py-2 rounded-xl text-xs font-bold mb-3">
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={shareInstagramStory} disabled={busy !== null}
            className="bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white font-black rounded-2xl py-3.5 disabled:opacity-60">
            <span className="block text-xl mb-0.5">📸</span>
            <span className="text-xs">Story IG</span>
            {igButton()}
          </button>
          <button onClick={shareInstagramFeed} disabled={busy !== null}
            className="bg-[#E1306C] text-white font-black rounded-2xl py-3.5 disabled:opacity-60">
            <span className="block text-xl mb-0.5">📷</span>
            <span className="text-xs">Feed IG</span>
          </button>
          <button onClick={shareTikTok} disabled={busy !== null}
            className="bg-[#0D0D0D] text-white font-black rounded-2xl py-3.5 disabled:opacity-60 border border-white/10">
            <span className="block text-xl mb-0.5">🎵</span>
            <span className="text-xs">TikTok</span>
            {ttButton()}
          </button>
          <button onClick={shareWhatsApp}
            className="bg-green-500 text-white font-black rounded-2xl py-3.5">
            <span className="block text-xl mb-0.5">💬</span>
            <span className="text-xs">WhatsApp</span>
          </button>
          <button onClick={copyLink}
            className="bg-brand-elev text-ink-primary font-black rounded-2xl py-3.5">
            <span className="block text-xl mb-0.5">🔗</span>
            <span className="text-xs">Copiar link</span>
          </button>
          <button onClick={downloadBlob} disabled={!imageBlob}
            className="bg-brand-elev text-ink-primary font-black rounded-2xl py-3.5 disabled:opacity-40">
            <span className="block text-xl mb-0.5">⬇</span>
            <span className="text-xs">Baixar PNG</span>
          </button>
        </div>

        <p className="text-[10px] text-ink-muted text-center mt-4">
          🛡️ Instagram/TikTok exigem aprovação dos apps para post automático.
          Por enquanto, o app salva a imagem e abre o app social no celular.
        </p>
      </div>
    </div>
  )
}
