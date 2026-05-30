'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BELTS, getCurriculumByBelt } from '@/lib/curriculum'
import type { BeltId } from '@/lib/supabase/types'

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

export default function NovoTreinoPage() {
  const router = useRouter()

  // Form state
  const [type, setType] = useState<TrainingType>('gi')
  const [duration, setDuration] = useState<number | ''>(60)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
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
  const [techSearch, setTechSearch] = useState('')
  const [showTechPicker, setShowTechPicker] = useState(false)
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
        supabase.from('profiles').select('belt_id, academy_name, weight_kg').eq('id', user.id).single(),
        supabase.from('academies').select('id, name').eq('active', true).order('name'),
        supabase.from('training_sessions').select('id').eq('user_id', user.id)
          .gte('trained_at', new Date().toISOString().split('T')[0]),
      ])
      const prof = p as { belt_id: string; academy_name: string | null; weight_kg: number | null } | null
      setProfile(prof)
      setAcademies((acs ?? []) as { id: string; name: string }[])
      setAcademyName(prof?.academy_name ?? '')
      setTodayCount((todayTrains ?? []).length)
    }
    load()
  }, [router])

  const curriculum = profile ? getCurriculumByBelt(profile.belt_id as BeltId) : null
  const allTechs = curriculum
    ? curriculum.modules.flatMap(m => m.categories.flatMap(c => c.techniques.map(t => t.name)))
    : []
  const filteredTechs = allTechs.filter(t =>
    !techSearch || t.toLowerCase().includes(techSearch.toLowerCase())
  ).slice(0, 30)

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
        type,
        duration_min: duration,
        trained_at:   trainedAt,
        instructor:   instructor || null,
        techniques,
        rolls,
        subs_for:     subsFor,
        subs_against: subsAgainst,
        feeling,
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

  const calories = duration ? estimateCalories(duration, profile?.weight_kg ?? null) : 0

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col">
      <div className="bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/dashboard" className="text-[#555] text-sm">← Cancelar</Link>
        <h1 className="font-black text-base tracking-tight">Novo treino</h1>
        <button onClick={save} disabled={saving || !duration}
          className="text-[#CC0000] font-black text-sm disabled:opacity-30">
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

        {/* Date — defaults today, allows past */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="field-label">Data do treino</label>
          <input type="date"
            className="field-input"
            max={new Date().toISOString().split('T')[0]}
            value={date}
            onChange={e => setDate(e.target.value)} />
        </div>

        {/* Type */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="field-label mb-3">Tipo de treino</p>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setType(t.value)}
                className={`py-3 px-2 rounded-xl border-2 text-center transition-all ${
                  type === t.value ? 'border-[#CC0000] bg-[#FFF0F0]'
                  : 'border-[#E5E5E5] bg-white'
                }`}>
                <div className="text-xl mb-1">{t.emoji}</div>
                <p className={`text-xs font-black ${type === t.value ? 'text-[#CC0000]' : 'text-[#555]'}`}>{t.label}</p>
              </button>
            ))}
          </div>
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

        {/* Techniques / positions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="field-label mb-0">Posições treinadas</p>
            <button onClick={() => setShowTechPicker(s => !s)}
              className="text-xs text-[#CC0000] font-black">
              {showTechPicker ? 'Fechar' : '+ Adicionar'}
            </button>
          </div>

          {techniques.length === 0 && !showTechPicker && (
            <p className="text-xs text-[#AAA]">Nenhuma posição selecionada</p>
          )}

          {techniques.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {techniques.map(t => (
                <button key={t} onClick={() => toggleTech(t)}
                  className="bg-[#FFF0F0] border border-[#FFCCCC] text-[#CC0000] rounded-full px-2.5 py-1 text-xs font-bold">
                  {t} ✕
                </button>
              ))}
            </div>
          )}

          {showTechPicker && (
            <div className="mt-2">
              <input
                className="field-input mb-2"
                placeholder="Buscar posição..."
                value={techSearch}
                onChange={e => setTechSearch(e.target.value)} />
              <div className="max-h-60 overflow-y-auto scrollbar-none space-y-1">
                {filteredTechs.map(t => (
                  <button key={t} onClick={() => toggleTech(t)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      techniques.includes(t)
                        ? 'bg-[#FFF0F0] text-[#CC0000]'
                        : 'bg-[#F8F7F5] text-[#555]'
                    }`}>
                    {techniques.includes(t) ? '✓ ' : ''}{t}
                  </button>
                ))}
              </div>
            </div>
          )}
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
            <label className="flex items-center justify-center bg-[#F8F7F5] border-2 border-dashed border-[#D0D0D0] rounded-xl py-8 cursor-pointer hover:border-[#CC0000] transition-colors">
              <div className="text-center">
                <p className="text-2xl mb-1">📷</p>
                <p className="text-xs text-[#555] font-bold">Tirar foto ou enviar</p>
              </div>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            </label>
          )}
        </div>

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

        {/* Note */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="field-label">Anotações</label>
          <textarea
            className="field-input"
            rows={3}
            placeholder="O que aprendeu hoje? Pontos a melhorar..."
            value={note}
            onChange={e => setNote(e.target.value)} />
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

      <div className="bg-white border-t border-[#E5E5E5] px-4 py-3 sticky bottom-0">
        <button onClick={save} disabled={saving || !duration}
          className="btn-primary disabled:opacity-40">
          {saving ? (uploadProgress || 'Salvando...') : '🥋 Salvar treino'}
        </button>
      </div>
    </div>
  )
}
