import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface SubscriptionInput {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => null)) as SubscriptionInput | null
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const ua = req.headers.get('user-agent') ?? null
  const { error } = await (supabase.from('push_subscriptions') as ReturnType<typeof supabase.from>)
    .upsert({
      user_id:    user.id,
      endpoint:   body.endpoint,
      p256dh:     body.keys.p256dh,
      auth:       body.keys.auth,
      user_agent: ua,
    } as never, { onConflict: 'endpoint' } as never)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
