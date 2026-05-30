import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface PostLite { id: string; photo_url: string }

export default async function ProfilePosts({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('training_sessions')
    .select('id, photo_url')
    .eq('user_id', userId).not('photo_url', 'is', null)
    .neq('visibility', 'private')
    .order('trained_at', { ascending: false })
    .limit(60)
  const posts = (data ?? []) as PostLite[]

  if (posts.length === 0) return null

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-2 px-1">Posts</p>
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map(p => (
          <Link key={p.id} href={`/treino/${p.id}/share`}
            className="relative aspect-square block bg-brand-elev overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.photo_url} alt="" loading="lazy"
              className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
          </Link>
        ))}
      </div>
    </div>
  )
}
