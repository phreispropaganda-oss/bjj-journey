'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  return { subscription, loading: false, isPro: false, isAcademy: false }
}
