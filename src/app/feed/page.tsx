import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/ui/BottomNav'
import FeedClient from '@/components/feed/FeedClient'

const BELT_COLOR: Record<string, string> = {
  white:'#E8E8E8', blue:'#2563EB', purple:'#7C3AED', brown:'#92400E', black:'#1A1A1A',
}
const BELT_NAME: Record<string, string> = {
  white:'Branca', blue:'Azul', purple:'Roxa', brown:'Marrom', black:'Preta',
}

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  gi:          { emoji:'🥋', label:'Gi' },
  no_gi:       { emoji:'👕', label:'No-Gi' },
  drilling:    { emoji:'🔁', label:'Drilling' },
  competition: { emoji:'🏆', label:'Competição' },
  open_mat:    { emoji:'🤝', label:'Open Mat' },
}

interface SessionRow {
  id: string; user_id: string; type: string; duration_min: number;
  trained_at: string; instructor: string | null; techniques: string[];
  rolls: number; subs_for: number; subs_against: number;
  feeling: number | null; note: string | null; photo_url: string | null;
}
interface ProfileLite {
  id: string; name: string; username: string;
  belt_id: string; degrees: number; academy_name: string | null;
}

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Who do I follow?
  const { data: followingData } = await supabase
    .from('follows').select('following_id').eq('follower_id', user.id)
  const followingIds = ((followingData ?? []) as { following_id: string }[]).map(f => f.following_id)
  const visibleUserIds = [...followingIds, user.id] // own + followed

  // Recent training sessions
  // Strategy: if user follows nobody, show all public sessions (discover mode)
  let sessions: SessionRow[] = []
  if (visibleUserIds.length > 1) {
    const { data } = await supabase
      .from('training_sessions')
      .select('id, user_id, type, duration_min, trained_at, instructor, techniques, rolls, subs_for, subs_against, feeling, note, photo_url')
      .in('user_id', visibleUserIds)
      .order('trained_at', { ascending: false })
      .limit(30)
    sessions = (data ?? []) as SessionRow[]
  }

  // Fallback: if empty, load public discover feed
  const discoverMode = sessions.length === 0
  if (discoverMode) {
    const { data } = await supabase
      .from('training_sessions')
      .select('id, user_id, type, duration_min, trained_at, instructor, techniques, rolls, subs_for, subs_against, feeling, note, photo_url')
      .eq('is_public', true)
      .order('trained_at', { ascending: false })
      .limit(30)
    sessions = (data ?? []) as SessionRow[]
  }

  // Get profiles + kudos + comments for these sessions
  const userIds    = [...new Set(sessions.map(s => s.user_id))]
  const sessionIds = sessions.map(s => s.id)

  const [{ data: profiles }, { data: kudosData }, { data: commentsData }] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, name, username, belt_id, degrees, academy_name').in('id', userIds)
      : Promise.resolve({ data: [] }),
    sessionIds.length
      ? supabase.from('kudos').select('session_id, user_id').in('session_id', sessionIds)
      : Promise.resolve({ data: [] }),
    sessionIds.length
      ? supabase.from('comments').select('id, session_id, user_id, text, created_at').in('session_id', sessionIds).order('created_at')
      : Promise.resolve({ data: [] }),
  ])

  const profMap: Record<string, ProfileLite> = {}
  ;((profiles ?? []) as ProfileLite[]).forEach(p => { profMap[p.id] = p })

  // Comments need author names too
  const commentUserIds = [...new Set(((commentsData ?? []) as { user_id: string }[]).map(c => c.user_id))]
    .filter(id => !profMap[id])
  if (commentUserIds.length > 0) {
    const { data: extra } = await supabase
      .from('profiles').select('id, name, username, belt_id, degrees, academy_name').in('id', commentUserIds)
    ;((extra ?? []) as ProfileLite[]).forEach(p => { profMap[p.id] = p })
  }

  // Build feed items
  const feedItems = sessions.map(s => {
    const prof = profMap[s.user_id]
    const kudos = ((kudosData ?? []) as { session_id: string; user_id: string }[])
      .filter(k => k.session_id === s.id)
    const sessionComments = ((commentsData ?? []) as { id: string; session_id: string; user_id: string; text: string; created_at: string }[])
      .filter(c => c.session_id === s.id)
      .map(c => ({ ...c, author: profMap[c.user_id] }))
    return {
      session: s,
      author: prof,
      kudosCount: kudos.length,
      iOssed: kudos.some(k => k.user_id === user.id),
      comments: sessionComments,
      typeMeta: TYPE_META[s.type] ?? { emoji: '🥋', label: s.type },
    }
  })

  // Current user info
  const { data: myProfileData } = await supabase
    .from('profiles').select('username').eq('id', user.id).single()
  const myUsername = (myProfileData as { username: string } | null)?.username ?? ''

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col">
      <div className="bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#CC0000] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-[10px] tracking-tighter">BR</span>
          </div>
          <h1 className="font-black text-base tracking-tight">Feed</h1>
          {discoverMode && (
            <span className="bg-[#F2F0ED] text-[#666] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Descobrir
            </span>
          )}
        </div>
        <span className="text-xs text-[#AAA] font-bold">{feedItems.length} treinos</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pt-3 pb-24 space-y-3">
        {feedItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">🥋</p>
            <p className="font-black text-[#0D0D0D] text-lg mb-1">Sem treinos ainda</p>
            <p className="text-[#888] text-sm">Registre seu primeiro treino e ele aparecerá aqui!</p>
          </div>
        ) : (
          feedItems.map(item => (
            <FeedClient
              key={item.session.id}
              item={item}
              currentUserId={user.id}
              currentUsername={myUsername}
              beltColor={BELT_COLOR}
              beltName={BELT_NAME}
            />
          ))
        )}
      </div>

      <BottomNav active="feed" />
    </div>
  )
}
