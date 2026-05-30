'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { BELTS } from '@/lib/curriculum'
import { updateAcademy } from '@/app/academy/[id]/admin/actions'

interface Academy {
  id: string; name: string; logo_url: string | null;
  city: string | null; state_uf: string | null;
  address: string | null; description: string | null;
  schedule: string | null; website: string | null;
}
interface Member {
  user_id: string; role: string; active: boolean; joined_at: string;
  name: string; username: string; avatar_url: string | null;
  belt_id: string; degrees: number; xp: number; streak: number;
  last_session_at: string | null;
}

interface Props {
  academy: Academy
  members: Member[]
}

type Tab = 'editar' | 'alunos'

export default function AcademyAdminClient({ academy, members }: Props) {
  const [tab, setTab] = useState<Tab>('editar')
  const [form, setForm] = useState({
    name:        academy.name,
    description: academy.description ?? '',
    schedule:    academy.schedule ?? '',
    address:     academy.address ?? '',
    city:        academy.city ?? '',
    state_uf:    academy.state_uf ?? '',
    website:     academy.website ?? '',
  })
  const [saving, startSave] = useTransition()
  const [feedback, setFeedback] = useState('')

  function exportCSV() {
    const header = ['user_id', 'username', 'name', 'role', 'belt', 'degrees', 'xp', 'streak', 'last_session_at']
    const rows = members.map(m => [
      m.user_id, m.username, m.name, m.role, m.belt_id, m.degrees,
      m.xp, m.streak, m.last_session_at ?? '',
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `presenca-${academy.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function save() {
    setFeedback('')
    startSave(async () => {
      const r = await updateAcademy(academy.id, form)
      if (r.error) { setFeedback(`⚠️ ${r.error}`); return }
      setFeedback('✓ Salvo')
      setTimeout(() => setFeedback(''), 2000)
    })
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="bg-blood/15 border border-blood/30 text-blood px-3 py-2 rounded-xl text-sm font-bold">
          {feedback}
        </div>
      )}

      <div className="flex gap-2">
        {(['editar', 'alunos'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-full text-xs font-black min-h-tap ${
              tab === t ? 'bg-blood text-ink-primary' : 'bg-brand-elev text-ink-secondary'
            }`}>
            {t === 'editar' ? '✏️ Editar' : `👥 Alunos (${members.length})`}
          </button>
        ))}
      </div>

      {tab === 'editar' && (
        <div className="card-elev space-y-3">
          <Field label="Nome">
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="field-input" maxLength={120} />
          </Field>
          <Field label="Descrição">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="field-input" rows={3} maxLength={1000} />
          </Field>
          <Field label="Horários">
            <textarea value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
              className="field-input" rows={4} maxLength={1000}
              placeholder={'Seg/Qua 19h-21h\nTer/Qui 06h-08h\nSáb 09h-11h'} />
          </Field>
          <Field label="Endereço">
            <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="field-input" maxLength={200} />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Cidade" className="col-span-2">
              <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="field-input" maxLength={80} />
            </Field>
            <Field label="UF">
              <input type="text" value={form.state_uf} onChange={e => setForm(f => ({ ...f, state_uf: e.target.value.toUpperCase() }))}
                className="field-input" maxLength={2} />
            </Field>
          </div>
          <Field label="Site (URL)">
            <input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              className="field-input" placeholder="https://" />
          </Field>
          <button onClick={save} disabled={saving} className="btn-primary w-full disabled:opacity-40">
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      )}

      {tab === 'alunos' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary flex-1">{members.length} membros</p>
            <button onClick={exportCSV}
              className="bg-volt text-brand-bg font-black text-xs px-3 py-1.5 rounded-full">
              ⬇ CSV
            </button>
          </div>

          {members.length === 0 && (
            <div className="card-elev text-center py-8">
              <p className="text-4xl mb-2">👥</p>
              <p className="text-sm text-ink-secondary">Sem membros ainda. Adicione alunos via /academia/alunos.</p>
            </div>
          )}

          {members.map(m => {
            const belt = BELTS.find(b => b.id === m.belt_id) ?? BELTS[0]
            const last = m.last_session_at
              ? new Date(m.last_session_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
              : '—'
            return (
              <Link key={m.user_id} href={`/profile/${m.username}`}
                className="card-elev flex items-center gap-3 py-3">
                {m.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.avatar_url} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blood flex items-center justify-center text-ink-primary font-black">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-ink-primary text-sm font-bold truncate">{m.name}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-1.5 rounded-sm" style={{ background: belt.color }} />
                    <span className="text-ink-muted text-[10px]">{belt.name} · {m.degrees}°</span>
                    {m.role !== 'student' && (
                      <span className="bg-volt/20 text-volt text-[9px] font-black uppercase tracking-wider px-1.5 rounded">
                        {m.role}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-[10px] text-ink-muted">
                  <p>último: <span className="text-ink-secondary font-bold">{last}</span></p>
                  <p>🔥 {m.streak}d · ⚡ {m.xp}</p>
                </div>
              </Link>
            )
          })}

          <Link href={`/academia/promover`}
            className="block text-center bg-brand-elev text-ink-secondary text-xs font-black py-3 rounded-full mt-3 min-h-tap">
            🎖 Graduar aluno
          </Link>
        </div>
      )}
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}
