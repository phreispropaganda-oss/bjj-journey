import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/login/actions'
import BottomNav from '@/components/ui/BottomNav'
import ThemeToggle from '@/components/ui/ThemeToggle'

interface AcademyLite { id: string; name: string }

export default async function ProfileMenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles').select('username, name').eq('id', user.id).maybeSingle()
  const profile = profileRaw as { username: string; name: string } | null
  if (!profile) redirect('/onboarding')

  // Owner/coach das academias
  const { data: memRaw } = await supabase
    .from('academy_members')
    .select('academy_id, role, academies(id, name)')
    .eq('user_id', user.id)
    .in('role', ['owner', 'coach', 'student'])
  type Mem = { academy_id: string; role: string; academies: AcademyLite | AcademyLite[] | null }
  const memberships = (memRaw ?? []) as Mem[]
  const myAcademies = memberships.flatMap(m => {
    const a = m.academies
    const arr = Array.isArray(a) ? a : (a ? [a] : [])
    return arr.map(x => ({ ...x, role: m.role }))
  })

  // Owner da plataforma?
  const { data: platformAdmin } = await supabase
    .from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
  const isPlatformOwner = !!platformAdmin

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/profile/${profile.username}`} className="text-ink-muted text-sm">← Perfil</Link>
        <h1 className="font-display text-base text-ink-primary flex-1">Menu</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-2xl mx-auto w-full space-y-3">
        {/* Saudacao */}
        <div className="card-elev">
          <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary">Bem-vindo</p>
          <p className="font-display text-xl text-ink-primary">{profile.name}</p>
          <p className="text-xs text-ink-muted">@{profile.username}</p>
        </div>

        {/* Minhas academias */}
        {myAcademies.length > 0 && (
          <Section title="🏢 Minhas academias">
            {myAcademies.map(a => (
              <MenuItem key={a.id} href={`/academy/${a.id}`} label={a.name}
                hint={a.role === 'owner' ? 'Owner' : a.role === 'coach' ? 'Coach' : 'Aluno'} />
            ))}
            {myAcademies.some(a => ['owner', 'coach'].includes(a.role)) && (
              <MenuItem href={`/academy/${myAcademies.find(a => ['owner','coach'].includes(a.role))!.id}/admin`}
                label="Administrar minha academia" hint="Editar, alunos, CSV" />
            )}
          </Section>
        )}

        {/* Conta */}
        <Section title="👤 Conta">
          <MenuItem href="/profile/editar"   label="Editar perfil"        hint="Nome, peso, altura, anos" />
          <MenuItem href="/graduacao"        label="Verificar graduação"  hint="Subir comprovante" />
        </Section>

        {/* Treino */}
        <Section title="🥋 Treino">
          <MenuItem href="/treino/novo"  label="Registrar treino"  hint="Novo treino" />
          <MenuItem href="/checkin"      label="Check-in por GPS"  hint="Marcar presença" />
          <MenuItem href="/wrapped"      label="Belt Rise Wrapped" hint="Retrospectiva anual" />
          <MenuItem href="/desafios"     label="Desafios"          hint="Competir com a comunidade" />
        </Section>

        {/* Owner */}
        {isPlatformOwner && (
          <Section title="🛡 Administração">
            <MenuItem href="/owner"             label="Painel owner"      hint="Plataforma global" />
            <MenuItem href="/owner/moderacao"   label="Moderação"         hint="Reports + shadow-ban" />
            <MenuItem href="/owner/auditoria"   label="Auditoria"         hint="Log de ações" />
            <MenuItem href="/owner/usuarios"    label="Usuários"          hint="Lista global" />
            <MenuItem href="/owner/desafios"    label="Desafios oficiais" hint="Criar e gerenciar" />
          </Section>
        )}

        {/* Tema */}
        <ThemeToggle />

        {/* Ajuda */}
        <Section title="❓ Ajuda">
          <MenuItem href="/help"   label="Central de ajuda" hint="FAQ + suporte" />
          <MenuItem href="/pricing" label="Planos"          hint="Pro / Academia" />
        </Section>

        {/* Sair */}
        <form action={signOut}>
          <button type="submit"
            className="w-full bg-brand-elev text-blood font-black py-3 rounded-2xl text-sm min-h-tap">
            ⏻ Sair da conta
          </button>
        </form>
      </div>

      <BottomNav active="profile" username={profile.username} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary px-2">{title}</p>
      <div className="bg-brand-surface rounded-2xl border border-brand-elev overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function MenuItem({ href, label, hint }: { href: string; label: string; hint?: string }) {
  return (
    <Link href={href}
      className="flex items-center justify-between px-4 py-3 border-b border-brand-elev last:border-0 active:bg-brand-elev min-h-tap">
      <div>
        <p className="text-ink-primary text-sm font-bold">{label}</p>
        {hint && <p className="text-[10px] text-ink-muted">{hint}</p>}
      </div>
      <span className="text-ink-muted text-sm">›</span>
    </Link>
  )
}
