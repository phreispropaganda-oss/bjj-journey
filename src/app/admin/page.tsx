import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import Link from 'next/link'

type Profile = Database['public']['Tables']['profiles']['Row']

const BELT_LABELS: Record<string, string> = {
  white: 'Branca', blue: 'Azul', purple: 'Roxa', brown: 'Marrom', black: 'Preta',
}
const BELT_COLORS: Record<string, string> = {
  white: '#E8E8E8', blue: '#2563EB', purple: '#7C3AED', brown: '#92400E', black: '#1A1A1A',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check admin status
  const { data: adminCheck } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!adminCheck) redirect('/dashboard')

  const [
    { data: profilesRaw },
    { data: completionsRaw },
    { data: attendanceRaw },
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('technique_completions').select('user_id'),
    supabase.from('attendance').select('user_id'),
  ])

  const profiles = (profilesRaw ?? []) as Profile[]
  const completions = (completionsRaw ?? []) as { user_id: string }[]
  const attendance = (attendanceRaw ?? []) as { user_id: string }[]

  const completionsByUser = completions.reduce<Record<string, number>>((acc, c) => {
    acc[c.user_id] = (acc[c.user_id] ?? 0) + 1
    return acc
  }, {})

  const attendanceByUser = attendance.reduce<Record<string, number>>((acc, a) => {
    acc[a.user_id] = (acc[a.user_id] ?? 0) + 1
    return acc
  }, {})

  const totalUsers = profiles.length
  const activeUsers = profiles.filter(p => (attendanceByUser[p.id] ?? 0) > 0).length

  return (
    <div className="min-h-screen bg-[#F7F4F0]">
      <div className="bg-white border-b border-[#E8E3DC] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <span className="font-bold text-lg">⚙️ Admin</span>
          <span className="text-xs text-[#666] ml-2">BJJ Journey</span>
        </div>
        <Link href="/dashboard" className="text-xs text-[#FF6B2B] font-semibold">← Dashboard</Link>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Usuários', value: totalUsers, color: '#FF6B2B' },
            { label: 'Ativos', value: activeUsers, color: '#1D9E75' },
            { label: 'Técnicas', value: completions.length, color: '#2563EB' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-[#666] mt-0.5 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E8E3DC]">
            <p className="text-xs font-bold uppercase tracking-wider text-[#666]">Todos os cadastros</p>
          </div>
          <div className="divide-y divide-[#F0EDE8]">
            {profiles.map(p => (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF6B2B] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(p.name?.charAt(0) ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A2E] truncate">{p.name || 'Sem nome'}</p>
                  <p className="text-xs text-[#AAA] truncate">@{p.username}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full" style={{ background: BELT_COLORS[p.belt_id] ?? '#ccc' }} title={BELT_LABELS[p.belt_id]} />
                  <span className="text-[10px] text-[#666]">{completionsByUser[p.id] ?? 0} téc.</span>
                  <span className="text-[10px] text-[#666]">{attendanceByUser[p.id] ?? 0} treinos</span>
                  <span className="text-[10px] font-bold text-[#FF6B2B]">{p.xp} XP</span>
                </div>
              </div>
            ))}
            {profiles.length === 0 && (
              <p className="px-4 py-6 text-sm text-[#AAA] text-center">Nenhum usuário cadastrado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
