export type BeltId = 'white' | 'blue' | 'purple' | 'brown' | 'black'
export type PlanType = 'free' | 'pro' | 'academy'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'

// ── PRD v2 — Schema fundacional ──
export type Modality =
  | 'bjj' | 'muay_thai' | 'boxe' | 'judo' | 'wrestling'
  | 'mma' | 'karate' | 'taekwondo' | 'grappling' | 'kickboxing'

export type LogSource = 'manual' | 'geofencing' | 'academy_qr' | 'academy_admin'
export type BeltStatus = 'declared' | 'pending' | 'verified' | 'rejected'
export type Visibility = 'public' | 'followers' | 'private'

export const MODALITY_META: Record<Modality, { label: string; emoji: string }> = {
  bjj:        { label: 'Jiu-Jitsu',    emoji: '🥋' },
  muay_thai:  { label: 'Muay Thai',    emoji: '🥊' },
  boxe:       { label: 'Boxe',         emoji: '🥊' },
  judo:       { label: 'Judô',         emoji: '🥋' },
  wrestling:  { label: 'Wrestling',    emoji: '🤼' },
  mma:        { label: 'MMA',          emoji: '🥋' },
  karate:     { label: 'Karatê',       emoji: '🥋' },
  taekwondo:  { label: 'Taekwondo',    emoji: '🥋' },
  grappling:  { label: 'Grappling',    emoji: '🤼' },
  kickboxing: { label: 'Kickboxing',   emoji: '🥊' },
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: { id: string; username: string; name: string; belt_id: BeltId; degrees: number; academy_name: string|null; academy_id: string|null; created_at: string; updated_at: string; is_public: boolean; xp: number; streak: number }; Insert: any; Update: any }
      technique_completions: { Row: { id: string; user_id: string; belt_id: BeltId; module_id: string; technique_name: string; completed_at: string }; Insert: any; Update: any }
      attendance: { Row: { id: string; user_id: string; date: string; created_at: string }; Insert: any; Update: any }
      achievements: { Row: { id: string; user_id: string; badge_id: string; unlocked_at: string }; Insert: any; Update: any }
      subscriptions: { Row: { id: string; user_id: string; stripe_customer_id: string|null; stripe_subscription_id: string|null; plan: PlanType; status: SubscriptionStatus; current_period_end: string|null; created_at: string; updated_at: string }; Insert: any; Update: any }
    }
  }
}
