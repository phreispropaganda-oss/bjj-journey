import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAccessBelt } from '@/lib/plans'
import { isViewingAsStudent } from '@/lib/view-mode'
import PaywallGate from '@/components/ui/PaywallGate'
import ModulesClient from '@/components/modules/ModulesClient'
import type { PlanType } from '@/lib/plans'

interface Props { params: Promise<{ beltId: string }> }

export default async function ModulesPage({ params }: Props) {
  const { beltId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check view-as-student mode (owner/admin temporary student view)
  const viewAsStudent = await isViewingAsStudent()

  // Owner / academy admin bypass — full access to all belts unless viewing as student
  if (!viewAsStudent) {
    const [{ data: adminCheck }, { data: memberAdmin }] = await Promise.all([
      supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('academy_members')
        .select('role').eq('user_id', user.id)
        .in('role', ['admin', 'instructor']).maybeSingle(),
    ])
    if (adminCheck || memberAdmin) {
      // Owner or academy admin → free access to everything
      return <ModulesClient beltId={beltId} />
    }
  }

  // Regular plan gate
  const { data: subRaw } = await supabase
    .from('subscriptions').select('plan, status').eq('user_id', user.id).single()
  const { data: memberRaw } = await supabase
    .from('academy_members').select('plan_override').eq('user_id', user.id).eq('active', true).maybeSingle()

  const sub    = subRaw    as { plan: PlanType; status: string } | null
  const member = memberRaw as { plan_override: PlanType | null } | null

  const effectivePlan: PlanType =
    member?.plan_override ?? (sub?.status === 'active' ? sub.plan : 'free') ?? 'free'

  if (!canAccessBelt(effectivePlan, beltId)) {
    return (
      <div className="min-h-screen flex flex-col bg-brand-bg">
        <PaywallGate beltId={beltId} />
      </div>
    )
  }

  return <ModulesClient beltId={beltId} />
}
