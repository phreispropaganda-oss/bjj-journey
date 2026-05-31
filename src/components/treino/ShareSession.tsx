'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { BELTS } from '@/lib/curriculum'
import { useRouter } from 'next/navigation'
import { generateStoryImage, shareToInstagramStories, TEMPLATE_META, type StoryTemplate } from '@/lib/storyImage'
import { deleteTrainingSession, updateSessionVisibility, type Visibility } from '@/app/treino/actions'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import ShareSheet from '@/components/sharing/ShareSheet'
import { createClient } from '@/lib/supabase/client'

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  gi:          { emoji:'🥋', label:'Gi' },
  no_gi:       { emoji:'👕', label:'No-Gi' },
  drilling:    { emoji:'🔁', label:'Drilling' },
  competition: { emoji:'🏆', label:'Competição' },
  open_mat:    { emoji:'🤝', label:'Open Mat' },
}
const FEELING_EMOJI: Record<number, string> = { 1:'😫', 2:'😐', 3:'🙂', 4:'💪', 5:'🔥' }

interface Props {
  session: {
    id: string; user_id: string; type: string; duration_min: number;
    trained_at: string; techniques: string[];
    rolls: number; subs_for: number; subs_against: number;
    feeling: number | null; note: string | null; photo_url: string | null;
  }
  profile: {
    name: string; username: string; belt_id: string; degrees: number;
    academy_name: string | null; xp: number; streak: number; avatar_url: string | null;
  }
  calories: number
  profileUrl: string
}

export default function ShareSession({ session, profile, calories, profileUrl }: Props) {
  const router = useRouter()
  const confirm = useConfirm()
  const [showPhoto, setShowPhoto] = useState(!!session.photo_url)
  const [generatingStory, setGeneratingStory] = useState(false)
  const [template, setTemplate] = useState<StoryTemplate>('classic')
  const [shareOpen, setShareOpen] = useState(false)
  const [shareBlob, setShareBlob] = useState<Blob | null>(null)
  const [shareConnections, setShareConnections] = useState<{ instagram?: 'connected' | 'disconnected'; tiktok?: 'connected' | 'disconnected' }>({})
  const [vis, setVis] = useState<Visibility>(((session as { visibility?: Visibility }).visibility ?? 'followers'))
  const [visBusy, setVisBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  async function handleVisibility(v: Visibility) {
    if (vis === v || visBusy) return
    setVisBusy(true)
    const prev = vis
    setVis(v)
    const r = await updateSessionVisibility(session.id, v)
    setVisBusy(false)
    if (r.error) { setVis(prev); alert('Erro ao atualizar visibilidade'); return }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Apagar este treino?',
      body: 'O treino e todos os comentários/oss serão removidos. Esta ação não pode ser desfeita.',
      confirmLabel: 'Apagar', destructive: true,
    })
    if (!ok || deleting) return
    setDeleting(true)
    const r = await deleteTrainingSession(session.id)
    setDeleting(false)
    if (r.error) { alert('Erro: ' + r.error); return }
    router.push('/dashboard')
  }

  const belt = BELTS.find(b => b.id === profile.belt_id) ?? BELTS[0]

  async function buildBlob(): Promise<Blob | null> {
    const tm = TYPE_META[session.type] ?? { emoji: '🥋', label: session.type }
    try {
      return await generateStoryImage({
        authorName:    profile.name,
        authorInitial: (profile.name?.charAt(0) ?? '?').toUpperCase(),
        avatarUrl:     profile.avatar_url,
        beltColor:     belt.color,
        beltName:      belt.name,
        degrees:       profile.degrees,
        typeEmoji:     tm.emoji,
        typeLabel:     tm.label,
        durationMin:   session.duration_min,
        calories,
        rolls:         session.rolls,
        subsFor:       session.subs_for,
        subsAgainst:   session.subs_against,
        feeling:       session.feeling,
        techniques:    session.techniques,
        photoUrl:      showPhoto ? session.photo_url : null,
        appUrl:        profileUrl.split('/profile/')[0],
        username:      profile.username,
        template,
      })
    } catch (err) {
      alert('Erro ao gerar imagem: ' + (err as Error).message)
      return null
    }
  }

  /** Flow legacy: gera + chama navigator.share / download direto */
  async function shareInstagramStory() {
    setGeneratingStory(true)
    const blob = await buildBlob()
    setGeneratingStory(false)
    if (!blob) return
    const r = await shareToInstagramStories(blob, `belt-rise-${template}-${session.id}.jpg`)
    if (r.downloaded) alert('Imagem 9:16 baixada! Abra o Instagram > Stories e use a foto da galeria.')
  }

  /** Flow universal: abre ShareSheet com todas as opcoes */
  async function openShareSheet() {
    setGeneratingStory(true)
    const blob = await buildBlob()
    setGeneratingStory(false)
    if (!blob) return
    setShareBlob(blob)

    // Buscar status de conexao das redes (best-effort)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('social_connections')
          .select('provider, status').eq('user_id', user.id)
        const conns: { instagram?: 'connected' | 'disconnected'; tiktok?: 'connected' | 'disconnected' } = {
          instagram: 'disconnected', tiktok: 'disconnected',
        }
        ;((data ?? []) as { provider: 'instagram' | 'tiktok'; status: string }[]).forEach(c => {
          if (c.status === 'connected') conns[c.provider] = 'connected'
        })
        setShareConnections(conns)
      }
    } catch { /* ignore */ }

    setShareOpen(true)
  }
  const typeMeta = TYPE_META[session.type] ?? { emoji: '🥋', label: session.type }
  const initial = (profile.name?.charAt(0) ?? '?').toUpperCase()
  const trainedDate = new Date(session.trained_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })

  // Legacy: shareInstagramStory mantido para compat (botao destacado nao existe mais
  // — toda interacao passa pelo ShareSheet universal via openShareSheet)
  void shareInstagramStory

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-brand-elev px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/dashboard" className="text-ink-secondary text-sm">← Início</Link>
        <h1 className="font-black text-base tracking-tight">Treino salvo!</h1>
        <Link href="/feed" className="text-rise text-sm font-bold">Feed</Link>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pt-4 pb-32 space-y-3">

        {/* Success banner */}
        <div className="bg-volt/10 border border-volt/40 rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-black text-volt-deep text-sm">+{Math.max(10, session.duration_min / 5)} XP ganhos!</p>
        </div>

        {/* ── SHARE CARD — visual atrativo para redes sociais ── */}
        <div ref={cardRef}
          className="rounded-3xl overflow-hidden shadow-xl relative"
          style={{ background: 'linear-gradient(160deg, #0D0D0D 0%, #1A1A1A 70%, #2A0000 100%)' }}>

          {/* Logo + url */}
          <div className="flex items-center justify-between px-5 pt-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#CC0000] rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-[11px]">BR</span>
              </div>
              <span className="text-white font-black text-sm tracking-tight">Belt Rise</span>
            </div>
            <span className="text-white/30 text-[10px] font-bold">{trainedDate}</span>
          </div>

          {/* Photo */}
          {session.photo_url && showPhoto && (
            <div className="px-5 pt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={session.photo_url} alt="Treino" className="w-full aspect-[4/3] object-cover rounded-2xl border border-white/10" />
            </div>
          )}

          {/* Athlete */}
          <div className="px-5 pt-4 flex items-center gap-3">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.name} className="w-12 h-12 rounded-full object-cover border-2 border-white/20" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#CC0000] flex items-center justify-center text-white font-black text-base border-2 border-white/20">
                {initial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-lg leading-tight">{profile.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-5 h-2.5 rounded-sm border border-white/10" style={{ background: belt.color }} />
                <span className="text-white/60 text-xs font-bold">Faixa {belt.name}</span>
                {profile.degrees > 0 && <span className="text-white/40 text-xs">· {profile.degrees}° grau</span>}
              </div>
            </div>
          </div>

          {/* Big stats: duration + calories */}
          <div className="px-5 pt-5 grid grid-cols-2 gap-3">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-3 border border-white/10">
              <p className="text-white/40 text-[9px] uppercase tracking-wider font-bold mb-1">Duração</p>
              <p className="text-white font-black text-3xl tabular-nums tracking-tight leading-none">
                {session.duration_min}<span className="text-base text-white/40">min</span>
              </p>
            </div>
            <div className="bg-[#CC0000]/20 backdrop-blur rounded-2xl p-3 border border-rise/30">
              <p className="text-[#FFCCCC] text-[9px] uppercase tracking-wider font-bold mb-1">Queimadas</p>
              <p className="text-white font-black text-3xl tabular-nums tracking-tight leading-none">
                {calories}<span className="text-base text-[#FFCCCC]">kcal</span>
              </p>
            </div>
          </div>

          {/* Type badge + feeling */}
          <div className="px-5 pt-3 flex items-center gap-2">
            <span className="bg-white/15 backdrop-blur text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
              {typeMeta.emoji} {typeMeta.label}
            </span>
            {session.feeling && (
              <span className="bg-white/15 backdrop-blur text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
                {FEELING_EMOJI[session.feeling]} Sensação {session.feeling}/5
              </span>
            )}
          </div>

          {/* Performance row */}
          {(session.rolls > 0 || session.subs_for > 0 || session.subs_against > 0) && (
            <div className="px-5 pt-3 grid grid-cols-3 gap-2">
              {[
                { v: session.rolls,        l: 'Rolas',     color: '#FFCCCC' },
                { v: session.subs_for,     l: 'Finalizei', color: '#86EFAC' },
                { v: session.subs_against, l: 'Sofridos',  color: '#FCD34D' },
              ].map(s => (
                <div key={s.l} className="bg-white/5 backdrop-blur rounded-xl py-2 text-center border border-white/5">
                  <p className="font-black text-xl" style={{ color: s.color }}>{s.v}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">{s.l}</p>
                </div>
              ))}
            </div>
          )}

          {/* Techniques */}
          {session.techniques.length > 0 && (
            <div className="px-5 pt-3">
              <p className="text-white/40 text-[9px] uppercase tracking-wider font-bold mb-1.5">Posições treinadas</p>
              <div className="flex flex-wrap gap-1">
                {session.techniques.slice(0, 5).map(t => (
                  <span key={t} className="bg-white/10 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
                {session.techniques.length > 5 && (
                  <span className="text-white/40 text-[11px] font-bold px-1">+{session.techniques.length - 5}</span>
                )}
              </div>
            </div>
          )}

          {/* Note */}
          {session.note && (
            <div className="px-5 pt-3">
              <p className="text-white/70 text-xs italic leading-relaxed line-clamp-3">&ldquo;{session.note}&rdquo;</p>
            </div>
          )}

          {/* Footer: streak + url */}
          <div className="mt-4 mx-5 mb-5 pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="bg-white/10 rounded-full px-2 py-0.5 text-[10px] font-black text-white flex items-center gap-1">
                ⚡ {profile.xp.toLocaleString()} XP
              </span>
              <span className="bg-white/10 rounded-full px-2 py-0.5 text-[10px] font-black text-white flex items-center gap-1">
                🔥 {profile.streak}d
              </span>
            </div>
            <span className="text-white/30 text-[10px] font-bold">@{profile.username}</span>
          </div>
        </div>

        {/* Toggle photo */}
        {session.photo_url && (
          <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📷</span>
              <p className="text-sm font-bold">Incluir foto no card</p>
            </div>
            <button onClick={() => setShowPhoto(s => !s)}
              className={`w-12 h-6 rounded-full relative transition-colors ${showPhoto ? 'bg-[#CC0000]' : 'bg-[#E5E5E5]'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${showPhoto ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        )}

        {/* Share buttons */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary mb-3">Compartilhar nas redes</p>

          {/* Template picker — 3 layouts */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {(Object.keys(TEMPLATE_META) as (keyof typeof TEMPLATE_META)[]).map(k => (
              <button key={k} onClick={() => setTemplate(k as StoryTemplate)}
                className={`flex flex-col items-center gap-1 rounded-xl py-3 border-2 transition-all ${
                  template === k
                    ? 'border-rise bg-rise/10'
                    : 'border-brand-elev bg-brand-surface hover:border-rise/40'
                }`}>
                <span className="text-xl leading-none">{TEMPLATE_META[k].emoji}</span>
                <span className={`text-[10px] font-black ${template === k ? 'text-rise' : 'text-ink-secondary'}`}>
                  {TEMPLATE_META[k].label}
                </span>
              </button>
            ))}
          </div>

          {/* Botão único universal — abre ShareSheet com todas opções */}
          <button onClick={openShareSheet} disabled={generatingStory}
            className="w-full flex items-center justify-center gap-2 bg-rise text-white font-display rounded-2xl py-4 shadow-glow-rise active:scale-[0.98] transition-transform disabled:opacity-60">
            <span className="text-xl">📤</span>
            <span className="text-base tracking-wide">
              {generatingStory ? 'Gerando imagem 9:16...' : 'COMPARTILHAR'}
            </span>
          </button>

          <p className="text-[10px] text-ink-muted text-center pt-3">
            Story IG • Feed IG • TikTok • WhatsApp • Copiar link • Baixar PNG
          </p>
        </div>

        {/* ShareSheet universal — abre ao clicar Compartilhar */}
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          imageBlob={shareBlob}
          caption={`${(TYPE_META[session.type] ?? { emoji: '🥋', label: session.type }).emoji} ${(TYPE_META[session.type] ?? { label: session.type }).label} · ⏱ ${session.duration_min}min · 🔥 ${calories}kcal\n${session.subs_for > 0 ? `🏆 ${session.subs_for} finalização${session.subs_for > 1 ? 'ões' : ''}\n` : ''}Belt Rise — minha jornada no tatame.`}
          profileUrl={`${profileUrl}?t=${session.id}`}
          filename={`belt-rise-${template}-${session.id}.jpg`}
          connections={shareConnections} />

        {/* Visibilidade + Apagar */}
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-2">Gestão do treino</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button onClick={() => handleVisibility('public')} disabled={visBusy}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-black border-2 ${
                vis === 'public' ? 'border-rise bg-rise/10 text-blood' : 'border-brand-elev text-ink-secondary'
              }`}>
              <span className="text-base">🌐</span> Público
            </button>
            <button onClick={() => handleVisibility('followers')} disabled={visBusy}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-black border-2 ${
                vis === 'followers' ? 'border-rise bg-rise/10 text-blood' : 'border-brand-elev text-ink-secondary'
              }`}>
              <span className="text-base">👥</span> Seguidores
            </button>
            <button onClick={() => handleVisibility('private')} disabled={visBusy}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-black border-2 ${
                vis === 'private' ? 'border-rise bg-rise/10 text-blood' : 'border-brand-elev text-ink-secondary'
              }`}>
              <span className="text-base">🔒</span> Só eu
            </button>
          </div>
          <button onClick={handleDelete} disabled={deleting}
            className="w-full flex items-center justify-center gap-1.5 bg-blood/10 text-blood font-black rounded-xl py-2.5 text-xs border border-blood/40 disabled:opacity-50">
            {deleting ? 'Apagando...' : '🗑️ Apagar este treino'}
          </button>
        </div>

        {/* Continue */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/dashboard"
            className="text-center bg-white border-2 border-brand-elev text-ink-secondary font-black py-3 rounded-2xl text-sm hover:border-rise hover:text-rise transition-colors">
            Voltar ao início
          </Link>
          <Link href="/treino/novo"
            className="text-center bg-[#CC0000] text-white font-black py-3 rounded-2xl text-sm hover:bg-[#9E0B13] transition-colors">
            + Outro treino
          </Link>
        </div>
      </div>
    </div>
  )
}
