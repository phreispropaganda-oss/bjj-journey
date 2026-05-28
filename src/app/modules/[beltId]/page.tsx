import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAccessBelt } from '@/lib/plans'
import PaywallGate from '@/components/ui/PaywallGate'
import ModulesClient from '@/components/modules/ModulesClient'
import type { PlanType } from '@/lib/plans'

interface Props { params: Promise<{ beltId: string }> }

export default async function ModulesPage({ params }: Props) {
  const { beltId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's effective plan (own subscription OR academy override)
  const { data: subRaw } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single()

  // Also check academy plan_override for this user
  const { data: memberRaw } = await supabase
    .from('academy_members')
    .select('plan_override')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle()

  const sub    = subRaw    as { plan: PlanType; status: string } | null
  const member = memberRaw as { plan_override: PlanType | null } | null

  // Effective plan: academy override > own subscription > free
  const effectivePlan: PlanType =
    member?.plan_override ??
    (sub?.status === 'active' ? sub.plan : 'free') ??
    'free'

  // Gate check
  if (!canAccessBelt(effectivePlan, beltId)) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F7F5]">
        <PaywallGate beltId={beltId} />
      </div>
    )
  }

  return <ModulesClient beltId={beltId} />
}
