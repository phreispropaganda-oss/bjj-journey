'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NovaAcademiaPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '',
    plan: 'free', student_limit: 30, billing_email: '',
    admin_email: '', // email do responsável da academia
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function set(k: string, v: string | number) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function save() {
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Create academy
    const { data: acad, error: acadErr } = await (supabase.from('academies') as ReturnType<typeof supabase.from>)
      .insert({
        name: form.name.trim(),
        email: form.email || null,
        phone: form.phone || null,
        city: form.city || null,
        plan: form.plan,
        student_limit: form.student_limit,
        billing_email: form.billing_email || null,
        created_by: user.id,
      } as never)
      .select('id')
      .single()

    if (acadErr || !acad) {
      setError((acadErr as Error)?.message ?? 'Erro ao criar academia')
      setSaving(false); return
    }

    // If admin_email provided, invite/link them
    if (form.admin_email) {
      const { data: adminProfile } = await supabase
        .from('profiles').select('id').eq('username', form.admin_email.replace('@', '')).maybeSingle()
      if (adminProfile) {
        await (supabase.from('academy_members') as ReturnType<typeof supabase.from>).insert({
          academy_id: (acad as { id: string }).id,
          user_id: (adminProfile as { id: string }).id,
          role: 'admin',
        } as never)
      }
    }

    setSuccess('Academia criada com sucesso!')
    setTimeout(() => router.push('/owner'), 1500)
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="bg-[#1A1A1A] border-b border-[#333] px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/owner" className="text-[#666] text-sm">← Owner</Link>
        <h1 className="text-white font-black text-base flex-1">Nova Academia</h1>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto pb-10">
        {/* Info básica */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-3">Informações básicas</p>
          <div className="space-y-3">
            {[
              { k: 'name', label: 'Nome da academia *', ph: 'Ex: Gracie Barra SP' },
              { k: 'email', label: 'Email de contato', ph: 'contato@academia.com' },
              { k: 'phone', label: 'Telefone', ph: '(11) 99999-9999' },
              { k: 'city', label: 'Cidade', ph: 'São Paulo, SP' },
            ].map(f => (
              <div key={f.k}>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#555] block mb-1">{f.label}</label>
                <input
                  className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#CC0000] placeholder:text-[#444]"
                  placeholder={f.ph}
                  value={(form as Record<string, string | number>)[f.k] as string}
                  onChange={e => set(f.k, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Plano */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-3">Plano</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { v: 'free',       label: 'Free',       desc: 'Até 30 alunos' },
              { v: 'pro',        label: 'Pro',        desc: 'Até 100 alunos' },
              { v: 'enterprise', label: 'Enterprise', desc: 'Ilimitado' },
            ].map(p => (
              <button key={p.v} onClick={() => set('plan', p.v)}
                className={`py-2.5 px-2 rounded-xl border-2 text-center transition-all ${
                  form.plan === p.v
                    ? 'border-[#CC0000] bg-[#CC0000]/10'
                    : 'border-[#333] bg-[#222]'
                }`}>
                <p className={`text-xs font-black ${form.plan === p.v ? 'text-[#CC0000]' : 'text-white'}`}>{p.label}</p>
                <p className="text-[10px] text-[#555] mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#555] block mb-1">Limite de alunos</label>
            <input type="number"
              className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#CC0000]"
              value={form.student_limit}
              onChange={e => set('student_limit', parseInt(e.target.value) || 30)}
            />
          </div>
        </div>

        {/* Admin da academia */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-1">Responsável admin</p>
          <p className="text-[#555] text-[11px] mb-3">Se o usuário já existe no sistema, ele será vinculado como admin da academia.</p>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#555] block mb-1">Email / username do responsável</label>
          <input
            className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#CC0000] placeholder:text-[#444]"
            placeholder="professor@email.com ou username"
            value={form.admin_email}
            onChange={e => set('admin_email', e.target.value)}
          />
        </div>

        {error && <p className="text-red-400 text-sm bg-red-900/20 rounded-xl px-3 py-2">{error}</p>}
        {success && <p className="text-green-400 text-sm bg-green-900/20 rounded-xl px-3 py-2">✅ {success}</p>}

        <button onClick={save} disabled={saving}
          className="w-full py-3.5 bg-[#CC0000] text-white font-black rounded-full text-sm disabled:opacity-50">
          {saving ? 'Criando...' : 'Criar academia →'}
        </button>
      </div>
    </div>
  )
}
