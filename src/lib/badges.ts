/** Mapeamento centralizado de badge_id → { emoji, name } */
export const BADGES: Record<string, { emoji: string; name: string }> = {
  // Badges atuais (badge_catalog SQL — gerados por triggers)
  first_session:    { emoji: '🥋', name: 'Primeiro treino' },
  ten_sessions:     { emoji: '🔟', name: '10 treinos' },
  fifty_sessions:   { emoji: '💪', name: '50 treinos' },
  hundred_sessions: { emoji: '💯', name: '100 treinos' },
  streak_30:        { emoji: '🔥', name: '30 dias seguidos' },
  streak_90:        { emoji: '⚡', name: '90 dias seguidos' },
  year_active:      { emoji: '🎂', name: '1 ano ativo' },
  first_verified:   { emoji: '✅', name: 'Faixa verificada' },
  // Legacy
  first_technique:  { emoji: '🎯', name: 'Primeira técnica' },
  ten_techniques:   { emoji: '🔟', name: '10 técnicas' },
  fifty_techniques: { emoji: '💪', name: '50 técnicas' },
  first_train:      { emoji: '🥋', name: 'Primeiro treino' },
  week_streak:      { emoji: '🔥', name: '7 dias seguidos' },
  month_streak:     { emoji: '⚡', name: '30 dias seguidos' },
  belt_complete:    { emoji: '🏆', name: 'Faixa completa' },
  hundred_xp:       { emoji: '⭐', name: '100 XP' },
}

export function labelForBadge(id: string): { emoji: string; name: string } {
  return BADGES[id] ?? { emoji: '🏆', name: id.replace(/_/g, ' ') }
}
