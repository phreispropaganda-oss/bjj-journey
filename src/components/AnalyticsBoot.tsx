'use client'

import { useEffect } from 'react'
import { initAnalytics, identify } from '@/lib/analytics'

export default function AnalyticsBoot({ userId, username }: { userId?: string; username?: string }) {
  useEffect(() => {
    initAnalytics()
    if (userId) identify(userId, { username })
  }, [userId, username])
  return null
}
