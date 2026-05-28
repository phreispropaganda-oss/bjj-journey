import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')

  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const supabase = await createClient()

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('id, belt_id, xp, streak, is_public')
    .eq('username', username)
    .single()

  const profile = profileRaw as { id: string; belt_id: string; xp: number; streak: number; is_public: boolean } | null

  if (!profile?.is_public) {
    return NextResponse.json({ error: 'Profile not public' }, { status: 403 })
  }

  const [{ data: completions }, { data: attendance }, { data: achievements }] = await Promise.all([
    supabase.from('technique_completions').select('belt_id, module_id, technique_name, completed_at').eq('user_id', profile.id),
    supabase.from('attendance').select('date').eq('user_id', profile.id).order('date', { ascending: false }).limit(90),
    supabase.from('achievements').select('badge_id, unlocked_at').eq('user_id', profile.id),
  ])

  return NextResponse.json({
    profile: { belt_id: profile.belt_id, xp: profile.xp, streak: profile.streak },
    completions: completions ?? [],
    attendance: attendance ?? [],
    achievements: achievements ?? [],
  })
}
