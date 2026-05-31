'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BELTS, getCurriculumByBelt } from '@/lib/curriculum'
import type { BeltId, Modality } from '@/lib/supabase/types'
import IntensitySlider from '@/components/treino/IntensitySlider'
import SmartTechChips from '@/components/treino/SmartTechChips'
import VoiceNoteInput from '@/components/treino/VoiceNoteInput'
import ModalitySelector from '@/components/treino/ModalitySelector'

type TrainingType = 'gi' | 'no_gi' | 'drilling' | 'competition' | 'open_mat'

const TYPES: { value: TrainingType; label: string; emoji: string }[] = [
  { value: 'gi',          label: 'Gi',         emoji: '🥋' },
  { value: 'no_gi',       label: 'No-Gi',      emoji: '👕' },
  { value: 'drilling',    label: 'Drilling',   emoji: '🔁' },
  { value: 'competition', label: 'Competição', emoji: '🏆' },
  { value: 'open_mat',    label: 'Open Mat',   emoji: '🤝' },
]

const FEELINGS = [
  { value: 1, emoji: '😫', label: 'Difícil' },
  { value: 2, emoji: '😐', label: 'Cansado' },
  { value: 3, emoji: '🙂', label: 'OK' },
  { value: 4, emoji: '💪', label: 'Forte' },
  { value: 5, emoji: '🔥', label: 'Voando' },
]

const DURATION_PRESETS = [45, 60, 75, 90, 120]

// MET por modalidade (mesmo cálculo do server-side trigger training_calc_calories)
const MET_BY_MODALITY: Record<string, number> = {
  bjj: 7.5, muay_thai: 9.8, boxe: 8.0, judo: 10.3, wrestling: 6.0,
  mma: 10.0, karate: 10.0, taekwondo: 10.0, grappling: 7.5, kickboxing: 10.3,
}
// Estimativa para preview — DB recalcula no insert (fonte de verdade)
function estimateCalories(durationMin: number, weightKg: number | null, modality = 'bjj') {
  const w = weightKg ?? 75
  const met = MET_BY_MODALITY[modality] ?? 7.5
  return Math.round(met * w * (durationMin / 60))
}

export default function NovoTreinoPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F7F5]" />}>
      <NovoTreinoPage />
    </Suspense>
  )
}

function NovoTreinoPage() {
  const router = useRouter()

  // Form state
  const [modality, setModality] = useState<Modality>('bjj')
  const [intensity, setIntensity] = useState<number | null>(null)
  const [type, setType] = useState<TrainingType>('gi')
  const [duration, setDuration] = useState<number | ''>(60)
  const sp = useSearchParams()
  const isRetro = sp.get('retro') === '1' || !!sp.get('date')
  const [date, setDate] = useState(sp.get('date') ?? new Date().toISOString().split('T')[0])
  const [academyName, setAcademyName] = useState('')
  const [customAcademy, setCustomAcademy] = useState('')
  const [instructor, setInstructor] = useState('')
  const [techniques, setTechniques] = useState<string[]>([])
  const [rolls, setRolls] = useState(0)
  const [subsFor, setSubsFor] = useState(0)
  const [subsAgainst, setSubsAgainst] = useState(0)
  const [feeling, setFeeling] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showPhotoSheet, setShowPhotoSheet] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  // (técnicas legadas — chips smart agora cuidam disso)
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('followers')

  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<{ belt_id: string; academy_name: string | null; weight_kg: number | null } | null>(null)
  const [academies, setAcademies] = useState<{ id: string; name: string }[]>([])
  const [todayCount, setTodayCount] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [{ data: p }, { data: acs }, { data: todayTrains }] = await Promise.all([
        supabase.from('profiles').select('belt_id, academy_name, weight_kg, current_modality').eq('id', user.id).single(),
        supabase.from('academies').select('id, name').eq('active', true).order('name'),
        supabase.from('training_sessions').select('id').eq('user_id', user.id)
          .gte('trained_at', new Date().toISOString().split('T')[0]),
      ])
      const prof = p as {
        belt_id: string; academy_name: string | null; weight_kg: number | null
        current_modality?: Modality
      } | null
      setProfile(prof)
      setAcademies((acs ?? []) as { id: string; name: string }[])
      setAcademyName(prof?.academy_name ?? '')
      setTodayCount((todayTrains ?? []).length)
      if (prof?.current_modality) setModality(prof.current_modality)
    }
    load()
  }, [router])

  // Curriculum referenciado por chips smart (mantido para compat futura)
  if (profile) getCurriculumByBelt(profile.belt_id as BeltId)

  function toggleTech(t: string) {
    setTechniques(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type) && !f.type.startsWith('image/')) {
      setError('Apenas imagens são aceitas (JPG, PNG, WEBP)'); return
    }
    if (f.size > 5 * 1024 * 1024) { setError('Foto deve ter no máximo 5MB'); return }
    setError('')
    setPhotoFile(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  // Resize image to max 1200px wide / 1200px tall, JPEG 85% quality
  async function compressImage(file: File): Promise<Blob> {
    const img = new Image()
    const url = URL.createObjectURL(file)
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url })
    URL.revokeObjectURL(url)
    const maxDim = 1200
    let { width, height } = img
    if (width > height && width > maxDim) { height = (height * maxDim) / width; width = maxDim }
    else if (height > maxDim) { width = (width * maxDim) / height; height = maxDim }
    const canvas = document.createElement('canvas')
    canvas.width = width; canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, width, height)
    return await new Promise<Blob>((res, rej) =>
      canvas.toBlob(b => b ? res(b) : rej(), 'image/jpeg', 0.85)
    )
  }

  async function uploadPhoto(userId: string): Promise<string | null> {
    if (!photoFile) return null
    const supabase = createClient()
    let blob: Blob = photoFile
    try { blob = await compressImage(photoFile) } catch { /* fallback to original */ }
    const path = `${userId}/${Date.now()}.jpg`
    const { error: upErr } = await supabase.storage
      .from('training-photos').upload(path, blob, {
        cacheControl: '3600', upsert: false, contentType: 'image/jpeg',
      })
    if (upErr) return null
    const { data: { publicUrl } } = supabase.storage.from('training-photos').getPublicUrl(path)
    return publicUrl
  }

  async function save() {
    if (!duration || duration < 1) { setError('Informe a duração do treino'); return }
    setSaving(true); setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: mem } = await supabase.from('academy_members')
      .select('academy_id').eq('user_id', user.id).eq('active', true).maybeSingle()
    const academyId = (mem as { academy_id: string } | null)?.academy_id ?? null
    const finalAcademy = customAcademy.trim() || academyName

    // Upload photo first (may take time, show progress separately)
    let photoUrl: string | null = null
    if (photoFile) {
      setUploadProgress('Enviando foto...')
      photoUrl = await uploadPhoto(user.id)
      setUploadProgress('')
    }

    const trainedAt = new Date(`${date}T${new Date().toTimeString().slice(0, 8)}`).toISOString()

    const { data: inserted, error: err } = await (supabase.from('training_sessions') as ReturnType<typeof supabase.from>)
      .insert({
        user_id:      user.id,
        academy_id:   academyId,
        modality,                       // PRD §1.3
        type,
        duration_min: duration,
        trained_at:   trainedAt,
        instructor:   instructor || null,
        techniques,
        rolls,
        subs_for:     subsFor,
        subs_against: subsAgainst,
        feeling,                        // sensação 1-5 (legado)
        intensity,                      // PRD §2.2 (1-10)
        note:         note || null,
        photo_url:    photoUrl,
        visibility,
        is_public:    visibility === 'public',
      } as never)
      .select('id')
      .single()

    if (err || !inserted) {
      const msg = err?.message ?? 'Erro ao salvar'
      // Mensagens humanizadas para os limites do PRD
      if (msg.includes('Limite diário')) {
        setError('⚠️ Você já registrou 4h de treino hoje. Volte amanhã!')
      } else if (msg.includes('Limite semanal')) {
        setError('⚠️ Você já registrou 30h de treino esta semana. Descanso é parte do treino!')
      } else {
        setError(msg)
      }
      setSaving(false)
      return
    }

    const sessionId = (inserted as { id: string }).id

    // Confirm session is readable before navigating (avoids 404 race)
    const { data: confirm } = await supabase
      .from('training_sessions').select('id').eq('id', sessionId).maybeSingle()

    if (!confirm) {
      setError('Treino salvo mas não pôde ser lido. Recarregue a página.')
      setSaving(false)
      return
    }

    // Update profile academy_name (non-blocking)
    if (finalAcademy && finalAcademy !== profile?.academy_name) {
      void (supabase.from('profiles') as ReturnType<typeof supabase.from>)
        .update({ academy_name: finalAcademy } as never).eq('id', user.id)
    }

    setSaving(false)
    router.push(`/treino/${sessionId}/share`)
  }

  const calories = duration ? estimateCalories(duration, profile?.weight_kg ?? null, modality) : 0

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="bg-brand-surface border-b border-brand-elev px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/dashboard" className="text-ink-secondary text-sm min-h-tap min-w-tap flex items-center">← Cancelar</Link>
        <h1 className="font-display text-base text-ink-primary">Novo treino</h1>
        <button onClick={save} disabled={saving || !duration}
          className="text-blood font-black text-sm disabled:opacity-30 min-h-tap min-w-tap">
          {saving ? '...' : 'Salvar'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 space-y-3 pb-32">

        {/* Hero: tipo + duração + calorias */}
        <div className="rounded-2xl p-5 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #CC0000 0%, #E52222 100%)' }}>
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
          <div className="relative z-10">
            {todayCount > 0 && (
              <div className="bg-white/20 rounded-full px-3 py-1 inline-flex items-center gap-1.5 mb-3 backdrop-blur-sm">
                <span className="text-xs">📌</span>
                <p className="text-white text-[11px] font-bold">
                  {todayCount}º treino de hoje
                </p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-wider mb-1">Duração</p>
                <p className="font-black text-5xl tabular-nums tracking-tight leading-none">
                  {duration || 0}<span className="text-2xl">min</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-[10px] font-black uppercase tracking-wider mb-1">Calorias</p>
                <p className="font-black text-3xl tabular-nums tracking-tight leading-none">
                  {calories}<span className="text-base">kcal</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Duration presets + input */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="field-label">Duração da aula (minutos)</label>
          <div className="flex gap-1.5 flex-wrap mb-2.5">
            {DURATION_PRESETS.map(m => (
              <button key={m} onClick={() => setDuration(m)}
                className={`flex-1 min-w-[60px] py-2 rounded-xl border-2 font-black text-sm transition-all ${
                  duration === m ? 'border-[#CC0000] bg-[#FFF0F0] text-[#CC0000]'
                  : 'border-[#E5E5E5] text-[#555]'
                }`}>
                {m}min
              </button>
            ))}
          </div>
          <input type="number" min={1} max={600}
            className="field-input"
            placeholder="Ou outro valor"
            value={duration}
            onChange={e => setDuration(e.target.value ? parseInt(e.target.value) : '')} />
          {!profile?.weight_kg && (
            <p className="text-[10px] text-[#AAA] mt-2">
              💡 Defina seu peso no perfil para cálculo mais preciso de calorias
            </p>
          )}
        </div>

        {/* Date — defaults today, allows past (treino retroativo) */}
        <div className={`rounded-2xl p-4 ${isRetro ? 'bg-[#FFF0F0] border-2 border-[#CC0000]' : 'bg-white shadow-sm'}`}>
          <label className="field-label">
            {isRetro ? '🕐 Data do treino retroativo' : 'Data do treino'}
          </label>
          <input type="date"
            className="field-input"
            max={new Date().toISOString().split('T')[0]}
            value={date}
            onChange={e => setDate(e.target.value)} />
          {isRetro && (
            <p className="text-[10px] text-[#9E0B13] font-bold mt-1.5">
              Voce esta registrando um treino do passado. Stats e badges sao recalculados.
            </p>
          )}
        </div>

        {/* Modalidade (PRD §1.3) */}
        <div className="card-elev">
          <ModalitySelector value={modality} onChange={setModality} />
        </div>

        {/* Tipo de treino */}
        <div className="card-elev">
          <p className="field-label mb-3">Tipo de treino</p>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setType(t.value)}
                className={`py-3 px-2 rounded-xl border-2 text-center transition-all min-h-tap ${
                  type === t.value
                    ? 'border-blood bg-blood/10'
                    : 'border-brand-elev bg-brand-surface'
                }`}>
                <div className="text-xl mb-1">{t.emoji}</div>
                <p className={`text-xs font-black ${type === t.value ? 'text-blood' : 'text-ink-secondary'}`}>{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* PRD §2.2 — Slider de intensidade 1-10 com haptic */}
        <div className="card-elev">
          <IntensitySlider value={intensity} onChange={setIntensity} />
        </div>

        {/* Academia + Professor */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="field-label">Academia</label>
            {academies.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {academies.map(a => (
                  <button key={a.id} onClick={() => { setAcademyName(a.name); setCustomAcademy('') }}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-bold text-left truncate transition-all ${
                      academyName === a.name && !customAcademy
                        ? 'border-[#CC0000] bg-[#FFF0F0] text-[#CC0000]'
                        : 'border-[#E5E5E5] text-[#555]'
                    }`}>
                    {a.name}
                  </button>
                ))}
              </div>
            )}
            <input className="field-input"
              placeholder="Ou digite o nome da academia"
              value={customAcademy}
              onChange={e => { setCustomAcademy(e.target.value); setAcademyName('') }} />
          </div>
          <div>
            <label className="field-label">Professor (opcional)</label>
            <input className="field-input"
              placeholder="Ex: Professor Ricardo"
              value={instructor}
              onChange={e => setInstructor(e.target.value)} />
          </div>
        </div>

        {/* Counters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="field-label mb-3">Performance</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Rolas',          value: rolls,        setter: setRolls,        color: '#CC0000' },
              { label: 'Finalizei',      value: subsFor,      setter: setSubsFor,      color: '#16A34A' },
              { label: 'Fui finalizado', value: subsAgainst,  setter: setSubsAgainst,  color: '#F59E0B' },
            ].map(c => (
              <div key={c.label} className="bg-[#F8F7F5] rounded-xl p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#888] mb-2">{c.label}</p>
                <p className="font-black text-2xl mb-2" style={{ color: c.color }}>{c.value}</p>
                <div className="flex gap-1.5 justify-center">
                  <button onClick={() => c.setter(Math.max(0, c.value - 1))}
                    className="w-7 h-7 rounded-full bg-white border border-[#E5E5E5] text-[#555] font-black">−</button>
                  <button onClick={() => c.setter(c.value + 1)}
                    className="w-7 h-7 rounded-full text-white font-black"
                    style={{ background: c.color }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRD §2.3 — Smart chips (algoritmo user+gym+explore) */}
        <div className="card-elev">
          <SmartTechChips
            selected={techniques}
            onToggle={toggleTech}
            modality={modality}
          />
        </div>

        {/* Photo */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="field-label mb-2">Foto (opcional)</p>
          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Preview" className="w-full aspect-[4/3] object-cover rounded-xl" />
              <button onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                className="absolute top-2 right-2 bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">✕</button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowPhotoSheet(true)}
              className="w-full flex items-center justify-center bg-[#F8F7F5] border-2 border-dashed border-[#D0D0D0] rounded-xl py-8 hover:border-[#CC0000] transition-colors">
              <div className="text-center">
                <p className="text-2xl mb-1">📷</p>
                <p className="text-xs text-[#555] font-bold">Adicionar foto</p>
              </div>
            </button>
          )}
          <input ref={cameraInputRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        {/* P0.4 — Photo source sheet */}
        {showPhotoSheet && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-end backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowPhotoSheet(false)}>
            <div className="bg-white w-full max-w-[480px] mx-auto rounded-t-3xl p-5"
              style={{ animation: 'fadeUp 0.25s ease' }}>
              <p className="text-center text-[10px] font-black uppercase tracking-wider text-[#888] mb-3">Escolha uma opção</p>
              <button type="button"
                onClick={() => { setShowPhotoSheet(false); cameraInputRef.current?.click() }}
                className="w-full flex items-center gap-3 bg-[#F8F7F5] hover:bg-[#FFF0F0] rounded-2xl px-4 py-3.5 mb-2 transition-colors">
                <span className="text-2xl">📸</span>
                <span className="font-black text-[#1A1A1A]">Tirar foto</span>
              </button>
              <button type="button"
                onClick={() => { setShowPhotoSheet(false); galleryInputRef.current?.click() }}
                className="w-full flex items-center gap-3 bg-[#F8F7F5] hover:bg-[#FFF0F0] rounded-2xl px-4 py-3.5 mb-2 transition-colors">
                <span className="text-2xl">🖼️</span>
                <span className="font-black text-[#1A1A1A]">Escolher da galeria</span>
              </button>
              <button type="button"
                onClick={() => setShowPhotoSheet(false)}
                className="w-full bg-[#E5E5E5] text-[#555] font-black rounded-full py-3 mt-2 text-sm">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Feeling */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="field-label mb-3">Como foi o treino?</p>
          <div className="grid grid-cols-5 gap-1.5">
            {FEELINGS.map(f => (
              <button key={f.value} onClick={() => setFeeling(f.value)}
                className={`py-3 rounded-xl border-2 transition-all ${
                  feeling === f.value
                    ? 'border-[#CC0000] bg-[#FFF0F0] scale-105'
                    : 'border-[#E5E5E5] bg-white'
                }`}>
                <div className="text-xl">{f.emoji}</div>
                <p className={`text-[9px] font-black mt-0.5 ${feeling === f.value ? 'text-[#CC0000]' : 'text-[#888]'}`}>
                  {f.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* PRD §2.1 — Anotações com voice-to-text */}
        <div className="card-elev">
          <label className="field-label">Anotações</label>
          <VoiceNoteInput value={note} onChange={setNote} />
        </div>

        {/* Visibility */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="field-label mb-3">Quem pode ver este treino?</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: 'public',    icon: '🌍', label: 'Global',    desc: 'Feed público' },
              { v: 'followers', icon: '👥', label: 'Seguidores', desc: 'Quem te segue' },
              { v: 'private',   icon: '🔒', label: 'Privado',   desc: 'Só você' },
            ] as const).map(opt => (
              <button key={opt.v} onClick={() => setVisibility(opt.v)}
                className={`py-3 px-2 rounded-xl border-2 text-center transition-all ${
                  visibility === opt.v
                    ? 'border-[#CC0000] bg-[#FFF0F0]'
                    : 'border-[#E5E5E5] bg-white'
                }`}>
                <div className="text-lg mb-1">{opt.icon}</div>
                <p className={`text-xs font-black ${visibility === opt.v ? 'text-[#CC0000]' : 'text-[#555]'}`}>{opt.label}</p>
                <p className="text-[10px] text-[#AAA] mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 font-bold text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      <div className="bg-brand-surface border-t border-brand-elev px-4 py-3 sticky bottom-0">
        <button onClick={save} disabled={saving || !duration}
          className="btn-primary disabled:opacity-40">
          {saving ? (uploadProgress || 'Salvando...') : '🥋 Salvar treino'}
        </button>
      </div>
    </div>
  )
}
