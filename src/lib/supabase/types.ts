export type BeltId = 'white' | 'blue' | 'purple' | 'brown' | 'black'
export type PlanType = 'free' | 'pro' | 'academy'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'

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
