'use client'

import { useState } from 'react'
import { reportContent, type ReportKind, type ReportReason } from '@/app/moderacao/actions'

const REASONS: { value: ReportReason; emoji: string; label: string }[] = [
  { value: 'spam',           emoji: '🚫', label: 'Spam ou propaganda' },
  { value: 'harassment',     emoji: '😠', label: 'Assédio ou bullying' },
  { value: 'hate',           emoji: '⚠️', label: 'Discurso de ódio' },
  { value: 'nudity',         emoji: '🔞', label: 'Nudez ou conteúdo sexual' },
  { value: 'violence',       emoji: '🩸', label: 'Violência gráfica' },
  { value: 'impersonation',  emoji: '🎭', label: 'Personificação' },
  { value: 'misinformation', emoji: '❓', label: 'Informação falsa' },
  { value: 'illegal',        emoji: '🚓', label: 'Atividade ilegal' },
  { value: 'other',          emoji: '📝', label: 'Outro' },
]

interface Props {
  targetId: string
  targetKind: ReportKind
  onClose: () => void
}

export default function ReportDialog({ targetId, targetKind, onClose }: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!reason) return
    setSubmitting(true); setError('')
    const r = await reportContent(targetId, targetKind, reason, description)
    setSubmitting(false)
    if (r.error) { setError(r.error); return }
    setSuccess(true)
    setTimeout(onClose, 1500)
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-6 backdrop-blur-sm">
        <div className="bg-brand-surface rounded-3xl p-6 text-center w-full max-w-sm border border-brand-elev">
          <p className="text-5xl mb-3">✓</p>
          <p className="font-display text-lg text-ink-primary mb-1">Denúncia enviada</p>
          <p className="text-sm text-ink-secondary">Nossa equipe vai analisar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-brand-surface w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] flex flex-col border border-brand-elev"
        style={{ animation: 'fadeUp 0.25s ease' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-ink-primary">Reportar</h3>
          <button onClick={onClose} className="text-ink-muted text-xl min-h-tap min-w-tap">✕</button>
        </div>

        <p className="text-sm text-ink-secondary mb-4">
          Por que você está reportando este conteúdo? Sua denúncia é anônima.
        </p>

        {/* Razões */}
        <div className="space-y-2 overflow-y-auto scrollbar-none mb-4 flex-1">
          {REASONS.map(r => (
            <button key={r.value}
              onClick={() => setReason(r.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all min-h-tap-lg ${
                reason === r.value
                  ? 'border-blood bg-blood/10'
                  : 'border-brand-elev bg-brand-bg hover:bg-brand-hover'
              }`}>
              <span className="text-xl">{r.emoji}</span>
              <span className={`text-sm font-bold ${reason === r.value ? 'text-blood' : 'text-ink-primary'}`}>
                {r.label}
              </span>
              {reason === r.value && <span className="ml-auto text-blood">✓</span>}
            </button>
          ))}
        </div>

        {/* Descrição opcional */}
        {reason && (
          <div className="mb-4">
            <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-1.5 block">
              Detalhes (opcional)
            </label>
            <textarea
              className="field-input"
              rows={2}
              placeholder="Conte mais sobre o motivo da denúncia..."
              maxLength={500}
              value={description}
              onChange={e => setDescription(e.target.value)} />
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-300 text-sm rounded-xl px-3 py-2 mb-3">
            ⚠️ {error}
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 bg-brand-elev text-ink-secondary font-black py-3 rounded-full text-sm min-h-tap">
            Cancelar
          </button>
          <button onClick={submit} disabled={!reason || submitting}
            className="flex-1 btn-primary disabled:opacity-40 py-3">
            {submitting ? 'Enviando...' : 'Reportar'}
          </button>
        </div>
      </div>
    </div>
  )
}
