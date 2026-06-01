'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NovaAcademiaPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '',
    plan: 'free', student_limit: 10, billing_email: '',
    admin_search: '',
  })

  // Plan limits — match DB function plan_student_limit()
  const PLAN_LIMITS: Record<string, number> = { free: 10, pro: 100, enterprise: 9999 }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isOwner, setIsOwner] = useState<boolean | null>(null)

  // Verify owner before showing form
  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
      setIsOwner(!!data)
      if (!data) router.push('/dashboard')
    }
    check()
  }, [router])

  function set(k: string, v: string | number, extraLimit?: number) {
    setForm(f => ({ ...f, [k]: v, ...(extraLimit !== undefined ? { student_limit: extraLimit } : {}) }))
  }

  async function save() {
    setError('')
    if (!form.name.trim()) { setError('Nome da academia é obrigatório'); return }
    if (form.name.trim().length < 2) { setError('Nome muito curto'); return }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // 1) Insert academy
    type AcadInsert = {
      name: string; email: string | null; phone: string | null; city: string | null;
      plan: string; student_limit: number; billing_email: string | null; created_by: string;
    }
    const payload: AcadInsert = {
      name:           form.name.trim(),
      email:          form.email.trim()    || null,
      phone:          form.phone.trim()    || null,
      city:           form.city.trim()     || null,
      plan:           form.plan,
      student_limit:  form.student_limit,
      billing_email:  form.billing_email.trim() || null,
      created_by:     user.id,
    }

    const { data: acad, error: acadErr } = await (supabase.from('academies') as ReturnType<typeof supabase.from>)
      .insert(payload as never)
      .select('id, name')
      .single()

    if (acadErr || !acad) {
      console.error('Erro ao criar academia:', acadErr)
      setError(`Erro ao criar academia: ${acadErr?.message ?? 'desconhecido'}`)
      setSaving(false)
      return
    }

    const academyId = (acad as { id: string }).id

    // 2) Link the owner (you) as academy admin so you can manage it
    const memberPayload = { academy_id: academyId, user_id: user.id, role: 'admin', active: true }
    await (supabase.from('academy_members') as ReturnType<typeof supabase.from>)
      .upsert(memberPayload as never)

    // 3) If admin_search provided, find by email OR username and link
    const searchValue = form.admin_search.trim().toLowerCase()
    if (searchValue) {
      // Try by username first, then by extracted username (left of @)
      const usernameTry = searchValue.includes('@')
        ? searchValue.split('@')[0]
        : searchValue
      const { data: adminProfile } = await supabase
        .from('profiles').select('id, name')
        .eq('username', usernameTry)
        .maybeSingle()

      if (adminProfile) {
        await (supabase.from('academy_members') as ReturnType<typeof supabase.from>)
          .upsert({
            academy_id: academyId,
            user_id:    (adminProfile as { id: string }).id,
            role:       'admin',
            active:     true,
          } as never)
      } else {
        setError(`Academia criada, mas usuário @${usernameTry} não foi encontrado para vincular como admin. Você pode adicioná-lo depois em Alunos.`)
        setSaving(false)
        setTimeout(() => router.push(`/owner/academias`), 3500)
        return
      }
    }

    setSuccess('🎉 Academia criada com sucesso!')
    setSaving(false)
    setTimeout(() => router.push('/owner'), 1500)
  }

  if (isOwner === null) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <p className="text-ink-secondary text-sm">Verificando permissões...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-[#1A1A1A] border-b border-brand-elev px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/owner" className="text-ink-secondary text-sm">← Owner</Link>
        <h1 className="text-white font-black text-base flex-1">Nova Academia</h1>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto pb-32">
        {/* Info básica */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary mb-3">Informações básicas</p>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                Nome da academia *
              </label>
              <input autoFocus
                className="w-full bg-brand-elev border border-brand-elev rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-rise placeholder:text-ink-muted"
                placeholder="Ex: Gracie Barra SP"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
            </div>
            {[
              { k: 'email', label: 'Email de contato',  ph: 'contato@academia.com', type: 'email' },
              { k: 'phone', label: 'Telefone',          ph: '(11) 99999-9999',      type: 'tel' },
              { k: 'city',  label: 'Cidade',            ph: 'São Paulo, SP',        type: 'text' },
            ].map(f => (
              <div key={f.k}>
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary block mb-1">{f.label}</label>
                <input type={f.type}
                  className="w-full bg-brand-elev border border-brand-elev rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-rise placeholder:text-ink-muted"
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
          <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary mb-3">Plano</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { v: 'free',       label: 'Free',       desc: 'Até 10 alunos',  priceMonth: 'Grátis' },
              { v: 'pro',        label: 'Pro',        desc: 'Até 100 alunos', priceMonth: 'R$99/mês' },
              { v: 'enterprise', label: 'Enterprise', desc: 'Ilimitado',      priceMonth: 'Sob consulta' },
            ].map(p => (
              <button key={p.v}
                onClick={() => set('plan', p.v, PLAN_LIMITS[p.v])}
                className={`py-3 px-2 rounded-xl border-2 text-center transition-all ${
                  form.plan === p.v
                    ? 'border-rise bg-rise/10'
                    : 'border-brand-elev bg-brand-elev'
                }`}>
                <p className={`text-xs font-black ${form.plan === p.v ? 'text-rise' : 'text-white'}`}>{p.label}</p>
                <p className="text-[10px] text-ink-secondary mt-1">{p.desc}</p>
                <p className={`text-[10px] mt-1 font-bold ${form.plan === p.v ? 'text-rise' : 'text-ink-muted'}`}>{p.priceMonth}</p>
              </button>
            ))}
          </div>
          <div className="bg-brand-elev rounded-xl px-3 py-2.5 text-ink-muted text-xs flex items-center gap-2">
            <span>📊</span>
            <span>Limite definido automaticamente: <strong className="text-white">{form.student_limit === 9999 ? 'ilimitado' : form.student_limit + ' alunos'}</strong></span>
          </div>
        </div>

        {/* Admin */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary mb-1">Responsável da academia</p>
          <p className="text-ink-secondary text-[11px] mb-3">
            Você será automaticamente vinculado como admin. Opcionalmente vincule outro responsável.
          </p>
          <label className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary block mb-1">Username do responsável (opcional)</label>
          <input
            className="w-full bg-brand-elev border border-brand-elev rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-rise placeholder:text-ink-muted"
            placeholder="@username ou username"
            value={form.admin_search}
            onChange={e => set('admin_search', e.target.value)}
          />
          <p className="text-[10px] text-ink-secondary mt-1.5">
            O usuário precisa já ter conta no Belt Rise.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm rounded-xl px-3 py-2.5">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/20 border border-green-800 text-green-400 text-sm rounded-xl px-3 py-2.5 font-bold">
            {success}
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-brand-bg border-t border-brand-elev px-4 py-3">
        <button onClick={save} disabled={saving || !form.name.trim()}
          className="w-full py-3.5 bg-rise text-white font-black rounded-full text-sm disabled:opacity-50">
          {saving ? 'Criando...' : 'Criar academia →'}
        </button>
      </div>
    </div>
  )
}
