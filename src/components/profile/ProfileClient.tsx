'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BELTS } from '@/lib/curriculum'
import BottomNav from '@/components/ui/BottomNav'
import { signOut } from '@/app/(auth)/login/actions'
import SignalGraduation from './SignalGraduation'
import type { Database } from '@/lib/supabase/types'
import type { BeltId } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

const BADGES: Record<string, { emoji: string; name: string }> = {
  first_technique:  { emoji: '🎯', name: 'Primeira técnica' },
  ten_techniques:   { emoji: '🔟', name: '10 técnicas' },
  fifty_techniques: { emoji: '💪', name: '50 técnicas' },
  first_train:      { emoji: '🥋', name: 'Primeiro treino' },
  week_streak:      { emoji: '🔥', name: '7 dias seguidos' },
  month_streak:     { emoji: '⚡', name: '30 dias seguidos' },
  belt_complete:    { emoji: '🏆', name: 'Faixa completa' },
  hundred_xp:       { emoji: '⭐', name: '100 XP' },
}

interface Props {
  profile: Profile & { weight_kg?: number | null; height_cm?: number | null; avatar_url?: string | null; bio?: string | null }
  achievements: { badge_id: string; unlocked_at: string }[]
  attendanceCount: number
  appUrl: string
  isOwner: boolean
  isAcademyAdmin: boolean
  academies: { id: string; name: string }[]
  mostTrainedPosition: string | null
  totalCalories: number
}

export default function ProfileClient({
  profile, achievements, attendanceCount, appUrl,
  isOwner, isAcademyAdmin, academies,
  mostTrainedPosition, totalCalories,
}: Props) {
  const router = useRouter()
  const belt = BELTS.find(b => b.id === profile.belt_id) ?? BELTS[0]
  const initial = (profile.name?.charAt(0) ?? '?').toUpperCase()

  const [editing, setEditing] = useState(false)
  const [name,        setName]        = useState(profile.name ?? '')
  const [beltId,      setBeltId]      = useState<BeltId>((profile.belt_id ?? 'white') as BeltId)
  const [degrees,     setDegrees]     = useState(profile.degrees ?? 0)
  const [isPublic,    setIsPublic]    = useState(profile.is_public ?? false)
  const [academyName, setAcademyName] = useState(profile.academy_name ?? '')
  const [customAcad,  setCustomAcad]  = useState('')
  const [yearsTraining, setYearsTraining] = useState((profile as { years_training?: number | null }).years_training ?? 0)
  const [birthDate,   setBirthDate]   = useState((profile as { birth_date?: string | null }).birth_date ?? '')
  const [weight,      setWeight]      = useState(profile.weight_kg ? String(profile.weight_kg) : '')
  const [height,      setHeight]      = useState(profile.height_cm ? String(profile.height_cm) : '')
  const [bio,         setBio]         = useState(profile.bio ?? '')
  const [avatarUrl,   setAvatarUrl]   = useState(profile.avatar_url ?? null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  async function compressAvatar(file: File): Promise<Blob> {
    const img = new Image()
    const url = URL.createObjectURL(file)
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url })
    URL.revokeObjectURL(url)
    // Square crop centered
    const size = Math.min(img.width, img.height, 600)
    const canvas = document.createElement('canvas')
    canvas.width = size; canvas.height = size
    const ctx = canvas.getContext('2d')!
    const sx = (img.width  - Math.min(img.width, img.height)) / 2
    const sy = (img.height - Math.min(img.width, img.height)) / 2
    ctx.drawImage(img, sx, sy, Math.min(img.width, img.height), Math.min(img.width, img.height), 0, 0, size, size)
    return await new Promise<Blob>((res, rej) =>
      canvas.toBlob(b => b ? res(b) : rej(), 'image/jpeg', 0.85)
    )
  }

  async function uploadAvatar(file: File) {
    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são aceitas'); return
    }
    if (file.size > 5 * 1024 * 1024) { setError('Avatar deve ter no máximo 5MB'); return }
    setUploadingAvatar(true); setError('')
    try {
      const supabase = createClient()
      let blob: Blob = file
      try { blob = await compressAvatar(file) } catch { /* keep original */ }
      const path = `${profile.id}/avatar-${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage
        .from('avatars').upload(path, blob, {
          cacheControl: '3600', upsert: true, contentType: 'image/jpeg',
        })
      if (upErr) { setError(`Erro upload: ${upErr.message}`); return }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      // Cache-bust the URL so the new image shows immediately
      const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`
      await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
        .update({ avatar_url: publicUrl } as never).eq('id', profile.id)
      setAvatarUrl(cacheBustedUrl)
      router.refresh()
    } finally {
      setUploadingAvatar(false)
    }
  }
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  const currentBelt = BELTS.find(b => b.id === beltId) ?? BELTS[0]

  async function save() {
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const finalAcademy = customAcad.trim() || academyName || null

    const { error: err } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
      .update({
        name:         name.trim(),
        belt_id:      beltId,
        degrees,
        is_public:    isPublic,
        academy_name: finalAcademy,
        weight_kg:    weight ? parseFloat(weight) : null,
        height_cm:    height ? parseInt(height) : null,
        years_training: yearsTraining,
        birth_date:   birthDate || null,
        bio:          bio.trim() || null,
      } as never)
      .eq('id', profile.id)

    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-brand-elev px-4 py-3 flex items-center justify-between flex-shrink-0">
        <h1 className="font-black text-base tracking-tight">Meu Perfil</h1>
        <button onClick={() => { setEditing(e => !e); setError('') }}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
            editing ? 'bg-[#CC0000] text-white' : 'bg-[#F2F0ED] text-ink-secondary'
          }`}>
          {editing ? 'Cancelar' : '✏️ Editar'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pt-4 pb-24 space-y-3">

        {/* Saved toast */}
        {saved && (
          <div className="bg-volt/10 border border-volt/40 rounded-2xl px-4 py-2.5 text-volt-deep font-bold text-sm flex items-center gap-2">
            ✅ Perfil atualizado com sucesso!
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5 text-red-600 text-sm font-bold">
            ⚠️ {error}
          </div>
        )}

        {/* Hero card */}
        <div className="relative overflow-hidden rounded-2xl text-white"
          style={{ background: 'linear-gradient(160deg, #0D0D0D 0%, #1A1A1A 100%)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#CC0000] rounded-full opacity-10 -translate-y-1/2 translate-x-1/2" />
          <div className="px-5 pt-6 pb-5 relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <label className="relative cursor-pointer group">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={profile.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/20" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#CC0000] flex items-center justify-center text-white font-black text-2xl border-2 border-white/20">
                    {initial}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-xs font-bold">{uploadingAvatar ? '...' : '📷'}</span>
                </div>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                  disabled={uploadingAvatar} />
              </label>
              <div className="flex-1">
                {editing ? (
                  <input
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white text-base font-black outline-none focus:border-rise w-full"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-xl font-black tracking-tight">{profile.name}</h2>
                )}
                <p className="text-white/40 text-sm mt-0.5">@{profile.username}</p>
              </div>
            </div>

            {/* Belt bar — shows edited belt when in edit mode */}
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2 mb-3">
              <div className="flex-1 h-5 rounded flex items-center overflow-hidden"
                style={{ background: editing ? currentBelt.color : belt.color }}>
                <div className="flex-1" />
                {Array.from({ length: editing ? degrees : (profile.degrees ?? 0) }).map((_, i) => (
                  <div key={i} className="w-1.5 h-[65%] bg-white/70 rounded-sm mr-0.5" />
                ))}
                <div className="w-3 h-full bg-black/80" />
              </div>
              <span className="text-white font-black text-sm flex-shrink-0">
                Faixa {editing ? currentBelt.name : belt.name}
              </span>
              {(editing ? degrees : (profile.degrees ?? 0)) > 0 && (
                <span className="text-white/40 text-xs">
                  · {editing ? degrees : profile.degrees}° grau
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { n: attendanceCount,                 l: 'Treinos'   },
                { n: profile.streak,                  l: 'Sequência' },
                { n: profile.xp,                      l: 'XP'        },
                { n: totalCalories.toLocaleString(),  l: 'Kcal'      },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <p className="text-white font-black text-base leading-none">{s.n}</p>
                  <p className="text-white/40 text-[9px] uppercase tracking-wider mt-1">{s.l}</p>
                </div>
              ))}
            </div>

            {mostTrainedPosition && (
              <div className="mt-3 bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-lg">🥋</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white/40 text-[9px] uppercase tracking-wider">Posição mais treinada</p>
                  <p className="text-white text-sm font-bold truncate">{mostTrainedPosition}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── EDIT FORM ── */}
        {editing && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary">Editar perfil</p>

            {/* Belt selector */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary block mb-2">Faixa atual</label>
              <div className="space-y-1.5">
                {BELTS.map(b => (
                  <div key={b.id} onClick={() => { setBeltId(b.id); setDegrees(0) }}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      beltId === b.id ? 'border-rise bg-rise/10' : 'border-brand-elev'
                    }`}>
                    <div className="w-8 h-5 rounded flex-shrink-0 border border-black/10" style={{ background: b.color }} />
                    <span className="text-sm font-bold flex-1">Faixa {b.name}</span>
                    {beltId === b.id && <span className="text-rise font-black text-sm">✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Degrees */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary block mb-2">
                Grau na faixa {currentBelt.name}
              </label>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: currentBelt.maxDeg + 1 }, (_, i) => (
                  <button key={i} onClick={() => setDegrees(i)}
                    className={`w-10 h-10 rounded-full border-2 font-black text-sm transition-all ${
                      degrees === i
                        ? 'bg-[#CC0000] border-rise text-white shadow-md shadow-red-900/20'
                        : 'bg-white border-brand-elev text-ink-secondary'
                    }`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Academy */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary block mb-2">Academia</label>
              {academies.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {academies.map(a => (
                    <button key={a.id} onClick={() => { setAcademyName(a.name); setCustomAcad('') }}
                      className={`py-2 px-3 rounded-xl border-2 text-xs font-bold text-left transition-all truncate ${
                        academyName === a.name && !customAcad
                          ? 'border-rise bg-rise/10 text-rise'
                          : 'border-brand-elev text-ink-secondary'
                      }`}>
                      {a.name}
                    </button>
                  ))}
                  <button onClick={() => { setAcademyName(''); }}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      !academyName && !customAcad
                        ? 'border-rise bg-rise/10 text-rise'
                        : 'border-brand-elev text-ink-secondary'
                    }`}>
                    Nenhuma
                  </button>
                </div>
              )}
              <input
                className="w-full bg-white border border-brand-elev rounded-xl px-3 py-3 text-base text-ink-primary placeholder:text-ink-muted outline-none focus:border-rise focus:ring-1 focus:ring-[#CC0000] placeholder:text-[#BBB]"
                placeholder="Ou digite o nome da sua academia..."
                value={customAcad}
                onChange={e => { setCustomAcad(e.target.value); setAcademyName('') }}
              />
            </div>

            {/* Bio */}
            <div className="pt-2 border-t border-brand-elev">
              <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary block mb-1.5">Bio (curta)</label>
              <textarea rows={2} maxLength={140}
                className="w-full bg-white border border-brand-elev rounded-xl px-3 py-3 text-base text-ink-primary placeholder:text-ink-muted outline-none focus:border-rise focus:ring-1 focus:ring-[#CC0000] resize-none"
                placeholder="Conte algo sobre sua jornada..."
                value={bio}
                onChange={e => setBio(e.target.value)} />
              <p className="text-[10px] text-ink-muted text-right">{bio.length}/140</p>
            </div>

            {/* Peso / altura */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary block mb-1.5">Peso (kg)</label>
                <input type="number" min={20} max={250} step={0.1}
                  className="w-full bg-white border border-brand-elev rounded-xl px-3 py-3 text-base text-ink-primary placeholder:text-ink-muted outline-none focus:border-rise focus:ring-1 focus:ring-[#CC0000]"
                  placeholder="Ex: 78"
                  value={weight}
                  onChange={e => setWeight(e.target.value)} />
                <p className="text-[10px] text-ink-muted mt-1">Para cálculo de calorias</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary block mb-1.5">Altura (cm)</label>
                <input type="number" min={100} max={250}
                  className="w-full bg-white border border-brand-elev rounded-xl px-3 py-3 text-base text-ink-primary placeholder:text-ink-muted outline-none focus:border-rise focus:ring-1 focus:ring-[#CC0000]"
                  placeholder="Ex: 178"
                  value={height}
                  onChange={e => setHeight(e.target.value)} />
              </div>
            </div>

            {/* Tempo de luta + Data nascimento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary block mb-1.5">Tempo de luta (anos)</label>
                <input type="number" min={0} max={60}
                  className="w-full bg-white border border-brand-elev rounded-xl px-3 py-3 text-base text-ink-primary placeholder:text-ink-muted outline-none focus:border-rise focus:ring-1 focus:ring-[#CC0000]"
                  placeholder="Ex: 5"
                  value={yearsTraining}
                  onChange={e => setYearsTraining(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary block mb-1.5">Data de nascimento</label>
                <input type="date"
                  className="w-full bg-white border border-brand-elev rounded-xl px-3 py-3 text-base text-ink-primary placeholder:text-ink-muted outline-none focus:border-rise focus:ring-1 focus:ring-[#CC0000]"
                  max={new Date().toISOString().slice(0,10)}
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)} />
              </div>
            </div>

            {/* Public toggle */}
            <div className="flex items-center justify-between py-2 border-t border-brand-elev">
              <div>
                <p className="text-sm font-bold">Perfil público</p>
                <p className="text-xs text-ink-muted mt-0.5">Aparece em rankings, feed e link de compartilhamento</p>
              </div>
              <button onClick={() => setIsPublic(p => !p)}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${isPublic ? 'bg-[#CC0000]' : 'bg-[#E5E5E5]'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <button onClick={save} disabled={saving || !name.trim()}
              className="w-full bg-[#CC0000] text-white font-black py-3.5 rounded-full text-sm disabled:opacity-50 shadow-lg shadow-red-900/20">
              {saving ? 'Salvando...' : '✓ Salvar alterações'}
            </button>
          </div>
        )}

        {/* Sinalizar graduação — para todos */}
        {!editing && (
          <SignalGraduation
            currentBelt={profile.belt_id}
            currentDegrees={profile.degrees ?? 0}
            username={profile.username}
            appUrl={appUrl}
          />
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary mb-3">
              Conquistas ({achievements.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {achievements.map(a => {
                const badge = BADGES[a.badge_id]
                if (!badge) return null
                return (
                  <div key={a.badge_id}
                    className="flex items-center gap-1.5 bg-rise/10 border border-[#FFCCCC] rounded-full px-3 py-1.5 text-[11px] font-bold text-rise"
                    title={new Date(a.unlocked_at).toLocaleDateString('pt-BR')}>
                    <span>{badge.emoji}</span>
                    <span>{badge.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Profile public link */}
        {profile.is_public && profile.username && (
          <Link href={`/profile/${profile.username}`}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm hover:bg-brand-bg transition-colors">
            <div className="w-9 h-9 rounded-xl bg-rise/10 flex items-center justify-center text-rise text-lg">👤</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink-primary">Ver perfil público</p>
              <p className="text-xs text-ink-muted truncate">{appUrl}/profile/{profile.username}</p>
            </div>
            <span className="text-ink-muted">›</span>
          </Link>
        )}

        {/* Admin links — only for owner */}
        {isOwner && (
          <Link href="/owner"
            className="flex items-center gap-3 bg-[#0D0D0D] rounded-2xl p-4 hover:bg-[#1A1A1A] transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#CC0000]/20 flex items-center justify-center text-rise text-lg">⚙️</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Painel Owner</p>
              <p className="text-xs text-white/40">Gestão completa da plataforma</p>
            </div>
            <span className="text-white/30">›</span>
          </Link>
        )}

        {/* Academia link — only for academy admins/instructors */}
        {isAcademyAdmin && (
          <Link href="/academia"
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm hover:bg-brand-bg transition-colors border border-brand-elev">
            <div className="w-9 h-9 rounded-xl bg-rise/10 flex items-center justify-center text-lg">🏢</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-ink-primary">Painel Academia</p>
              <p className="text-xs text-ink-muted">Gerenciar alunos e promoções</p>
            </div>
            <span className="text-ink-muted">›</span>
          </Link>
        )}

        {/* Logout */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <form action={signOut}>
            <button type="submit"
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 text-lg">🚪</div>
              <p className="text-sm font-bold text-red-500">Sair da conta</p>
            </button>
          </form>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  )
}
