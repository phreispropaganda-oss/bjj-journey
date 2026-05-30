'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BELTS } from '@/lib/curriculum'
import { requestBeltVerification } from '@/app/graduacao/actions'

interface Props {
  currentBelt: string
  currentDegrees: number
  academies: { id: string; name: string }[]
  userId: string
  disabled?: boolean
}

export default function RequestForm({ currentBelt, currentDegrees, academies, userId, disabled }: Props) {
  const [beltId, setBeltId] = useState(currentBelt)
  const [degrees, setDegrees] = useState(currentDegrees)
  const [academyId, setAcademyId] = useState(academies[0]?.id ?? '')
  const [instructorName, setInstructorName] = useState('')
  const [graduatedAt, setGraduatedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const belt = BELTS.find(b => b.id === beltId) ?? BELTS[0]

  async function uploadProof(): Promise<string | null> {
    if (!file) return null
    const supabase = createClient()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('belt-proofs')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (upErr) throw new Error(upErr.message)
    return path
  }

  async function submit() {
    if (disabled) return
    setError(''); setSubmitting(true)
    try {
      const proofPath = await uploadProof()
      const proofKind: 'photo' | 'document' = file?.type === 'application/pdf' ? 'document' : 'photo'
      const r = await requestBeltVerification({
        beltId, degrees,
        instructorName: instructorName || undefined,
        academyId:      academyId || null,
        graduatedAt:    graduatedAt || undefined,
        notes:          notes || undefined,
        proofPath:      proofPath || undefined,
        proofKind,
      })
      if (r.error) { setError(r.error); return }
      setSuccess(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="card-elev text-center py-8">
        <p className="text-5xl mb-2">✓</p>
        <p className="font-display text-ink-primary mb-1">Pedido enviado</p>
        <p className="text-sm text-ink-secondary">Seu professor receberá a solicitação. Você será notificado ao aprovar.</p>
      </div>
    )
  }

  return (
    <div className="card-elev space-y-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary">Solicitar verificação</p>

      {/* Belt picker */}
      <div>
        <label className="text-xs text-ink-secondary block mb-2">Faixa</label>
        <div className="grid grid-cols-5 gap-1.5">
          {BELTS.map(b => (
            <button key={b.id} onClick={() => { setBeltId(b.id); setDegrees(0) }}
              className={`flex flex-col items-center py-2 rounded-xl border-2 ${
                beltId === b.id ? 'border-blood' : 'border-brand-elev'
              }`}>
              <div className="w-8 h-3 rounded-sm mb-1" style={{ background: b.color }} />
              <span className="text-[10px] font-black text-ink-primary">{b.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Degrees */}
      <div>
        <label className="text-xs text-ink-secondary block mb-2">Graus ({degrees}/{belt.maxDeg})</label>
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: belt.maxDeg + 1 }, (_, i) => (
            <button key={i} onClick={() => setDegrees(i)}
              className={`w-9 h-9 rounded-full text-xs font-black ${
                degrees === i ? 'bg-blood text-ink-primary' : 'bg-brand-elev text-ink-secondary'
              }`}>
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Academy */}
      {academies.length > 0 && (
        <div>
          <label className="text-xs text-ink-secondary block mb-1">Academia onde foi graduado</label>
          <select value={academyId} onChange={e => setAcademyId(e.target.value)}
            className="field-input">
            <option value="">— Sem academia / autônomo —</option>
            {academies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      )}

      {/* Instructor */}
      <div>
        <label className="text-xs text-ink-secondary block mb-1">Nome do professor que graduou</label>
        <input type="text" value={instructorName} onChange={e => setInstructorName(e.target.value)}
          placeholder="Ex: Mestre João Silva" maxLength={120} className="field-input" />
      </div>

      {/* Graduation date */}
      <div>
        <label className="text-xs text-ink-secondary block mb-1">Data da graduação</label>
        <input type="date" value={graduatedAt} onChange={e => setGraduatedAt(e.target.value)}
          className="field-input" max={new Date().toISOString().slice(0,10)} />
      </div>

      {/* Proof upload */}
      <div>
        <label className="text-xs text-ink-secondary block mb-1">Foto/PDF do diploma ou cerimônia</label>
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-xs text-ink-secondary file:mr-3 file:rounded-full file:border-0 file:bg-blood file:text-ink-primary file:px-3 file:py-1.5 file:text-xs file:font-black" />
        {file && <p className="text-[10px] text-ink-muted mt-1">{file.name} · {(file.size / 1024).toFixed(0)}kb</p>}
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-ink-secondary block mb-1">Observações (opcional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          rows={2} maxLength={400} placeholder="Contexto, link de vídeo, etc"
          className="field-input" />
      </div>

      {error && <p className="text-blood text-xs">⚠️ {error}</p>}

      <button onClick={submit} disabled={submitting || disabled}
        className="btn-primary w-full disabled:opacity-40">
        {disabled ? 'Você já tem um pedido pendente' :
         submitting ? 'Enviando...' :
         'Enviar pedido de verificação'}
      </button>

      <p className="text-[10px] text-ink-muted">
        🛡️ Seu professor (ou admin) revisará. Aprovado, sua faixa fica com selo <strong className="text-volt">✓ verificada</strong>.
      </p>
    </div>
  )
}
