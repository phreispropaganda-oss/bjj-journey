'use client'

import { useState, useTransition } from 'react'
import { toggleFollow } from '@/app/feed/actions'

export default function FollowButton({
  targetUserId,
  initialFollowing,
  initialCount,
}: {
  targetUserId: string
  initialFollowing: boolean
  initialCount: number
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [pending, startTransition] = useTransition()

  function handle() {
    // Optimistic UI
    setFollowing(f => !f)
    setCount(c => c + (following ? -1 : 1))
    startTransition(async () => {
      const r = await toggleFollow(targetUserId)
      if ('error' in r && r.error) {
        // Revert on error
        setFollowing(f => !f)
        setCount(c => c + (following ? 1 : -1))
      }
    })
  }

  return (
    <button onClick={handle} disabled={pending}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-all ${
        following
          ? 'bg-white/10 text-white border border-white/20'
          : 'bg-rise text-white shadow-md shadow-red-900/30'
      }`}>
      {following ? '✓ Seguindo' : '+ Seguir'}
      {count > 0 && <span className="opacity-60">· {count}</span>}
    </button>
  )
}
