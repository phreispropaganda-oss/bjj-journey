'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createChallenge, toggleChallengeActive, deleteChallenge } from '@/app/owner/desafios/actions'
import { useConfirm } from '@/components/ui/ConfirmDialog'

const METRICS = [
  { v: 'training_count',   label: 'Treinos completados',  unit: 'treinos' },
  { v: 'training_minutes', label: 'Minutos totais',       unit: 'min' },
  { v: 'submissions',      label: 'Finalizações',         unit: 'finalizações' },
  { v: 'streak_days',      label: 'Dias consecutivos',    unit: 'dias' },
  { v: 'technique_count',  label: 'Técnicas marcadas',    unit: 'técnicas' },
] as const

const EMOJI_PICKER = ['🥋','⏱','🏆','🔥','💪','⚡','🎯','🌟','📚','🤝','🥇','💯']

interface Challenge {
  id: string; title: string; description: string; emoji: string;
  metric: string; target: number; scope: string; academy_id: string | null;
  starts_at: string; ends_at: string; active: boolean;
}

export default function DesafiosManager({
  challenges, academies, isOwner, academyAdminId,
}: {
  challenges: Challenge[]
  academies: { id: string; name: string }[]
  isOwner: boolean
  academyAdminId: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [feedback, setFeedback] = useState<string>('')
  const confirm = useConfirm()

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', emoji: '🥋',
    metric: 'training_count', target: 10,
    scope: isOwner ? 'global' : 'academy',
    academy_id: academyAdminId ?? '',
    starts_at: new Date().toISOString().split('T')[0],
    ends_at: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  })

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleCreate() {
    if (!form.title.trim()) { setFeedback('⚠️ Título obrigatório'); return }
    if (form.target < 1) { setFeedback('⚠️ Meta inválida'); return }
    startTransition(async () => {
      const r = await createChallenge({
        title: form.title,
        description: form.description,
        emoji: form.emoji,
        metric: form.metric,
        target: form.target,
        scope: form.scope as 'global' | 'academy',
        academy_id: form.scope === 'academy' ? form.academy_id : null,
        starts_at: form.starts_at,
        ends_at: form.ends_at,
      })
      if ('error' in r && r.error) { setFeedback(`⚠️ ${r.error}`); return }
      setFeedback('✅ Desafio criado!')
      setShowForm(false)
      router.refresh()
      setTimeout(() => setFeedback(''), 3000)
    })
  }

  async function handleToggleActive(c: Challenge) {
    startTransition(async () => {
      const r = await toggleChallengeActive(c.id, !c.active)
      if ('error' in r && r.error) { setFeedback(`⚠️ ${r.error}`); return }
      router.refresh()
    })
  }

  async function handleDelete(c: Challenge) {
    const ok = await confirm({
      title: `Excluir desafio "${c.title}"?`,
      body: 'Os participantes perderão acesso ao progresso. Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir', destructive: true,
    })
    if (!ok) return
    startTransition(async () => {
      const r = await deleteChallenge(c.id)
      if ('error' in r && r.error) { setFeedback(`⚠️ ${r.error}`); return }
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-2 text-sm text-white">{feedback}</div>
      )}

      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="w-full bg-[#CC0000] text-white font-black py-3 rounded-2xl text-sm">
          + Criar novo desafio
        </button>
      ) : (
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border-2 border-[#CC0000] space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#888]">Novo desafio</p>
            <button onClick={() => setShowForm(false)} className="text-[#666] text-lg">✕</button>
          </div>

          {/* Emoji */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#555] block mb-1.5">Ícone</label>
            <div className="flex gap-1.5 flex-wrap">
              {EMOJI_PICKER.map(e => (
                <button key={e} onClick={() => set('emoji', e)}
                  className={`w-9 h-9 rounded-lg text-base transition-all ${
                    form.emoji === e ? 'bg-[#CC0000]/30 border border-[#CC0000]' : 'bg-[#222] border border-[#333]'
                  }`}>{e}</button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#555] block mb-1.5">Título</label>
            <input
              className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#CC0000]"
              placeholder="Ex: Mestre da Meia Guarda"
              value={form.title}
              onChange={e => set('title', e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#555] block mb-1.5">Descrição</label>
            <textarea rows={2}
              className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#CC0000] resize-none"
              placeholder="Conte aos atletas o que devem fazer"
              value={form.description}
              onChange={e => set('description', e.target.value)} />
          </div>

          {/* Metric + target */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#555] block mb-1.5">Métrica</label>
              <select
                className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#CC0000]"
                value={form.metric}
                onChange={e => set('metric', e.target.value)}>
                {METRICS.map(m => <option key={m.v} value={m.v}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#555] block mb-1.5">Meta</label>
              <input type="number" min={1}
                className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#CC0000]"
                value={form.target}
                onChange={e => set('target', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#555] block mb-1.5">Início</label>
              <input type="date"
                className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#CC0000]"
                value={form.starts_at}
                onChange={e => set('starts_at', e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#555] block mb-1.5">Fim</label>
              <input type="date"
                className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#CC0000]"
                value={form.ends_at}
                onChange={e => set('ends_at', e.target.value)} />
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#555] block mb-1.5">Alcance</label>
            <div className="grid grid-cols-2 gap-2">
              {isOwner && (
                <button onClick={() => set('scope', 'global')}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-black ${
                    form.scope === 'global' ? 'border-[#CC0000] bg-[#CC0000]/10 text-[#CC0000]' : 'border-[#333] text-[#888]'
                  }`}>🌍 Global</button>
              )}
              <button onClick={() => set('scope', 'academy')}
                className={`py-2 px-3 rounded-xl border-2 text-xs font-black ${
                  form.scope === 'academy' ? 'border-[#CC0000] bg-[#CC0000]/10 text-[#CC0000]' : 'border-[#333] text-[#888]'
                }`}>🏢 Academia</button>
            </div>
            {form.scope === 'academy' && (
              <select
                className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#CC0000] mt-2"
                value={form.academy_id}
                onChange={e => set('academy_id', e.target.value)}
                disabled={!isOwner && !!academyAdminId}>
                <option value="">— escolha uma academia —</option>
                {academies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
          </div>

          <button onClick={handleCreate} disabled={pending}
            className="w-full bg-[#CC0000] text-white font-black py-3 rounded-full text-sm disabled:opacity-50 mt-2">
            {pending ? 'Criando...' : '✓ Criar desafio'}
          </button>
        </div>
      )}

      {/* List existing */}
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2A2A2A]">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#555]">
            Desafios existentes ({challenges.length})
          </p>
        </div>
        {challenges.length === 0 ? (
          <p className="text-center py-8 text-[#555] text-sm">Nenhum desafio ainda.</p>
        ) : challenges.map(c => (
          <div key={c.id} className="px-4 py-3 border-b border-[#1E1E1E] last:border-none">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{c.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-black truncate">{c.title}</p>
                <p className="text-[#555] text-[11px]">
                  {METRICS.find(m => m.v === c.metric)?.label ?? c.metric} · meta {c.target}
                </p>
                <p className="text-[#444] text-[10px] mt-0.5">
                  {new Date(c.starts_at).toLocaleDateString('pt-BR')} → {new Date(c.ends_at).toLocaleDateString('pt-BR')}
                  {c.scope === 'academy' && ' · 🏢 academia'}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => handleToggleActive(c)} disabled={pending}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                    c.active ? 'bg-green-900/30 text-green-400 border border-green-700'
                    : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700'
                  }`}>
                  {c.active ? 'Ativo' : 'Pausado'}
                </button>
                <button onClick={() => handleDelete(c)} disabled={pending}
                  className="text-[10px] font-bold px-2 py-1 rounded-md bg-red-900/30 text-red-400 border border-red-700">
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
