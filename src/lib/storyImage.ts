// MICHI 9:16 (1080x1920) story templates — client-side canvas

export type StoryTemplate = 'classic' | 'minimal' | 'hype' | 'stats'

export interface StoryData {
  authorName: string
  authorInitial: string
  avatarUrl: string | null
  beltColor: string
  beltName: string
  degrees: number
  typeEmoji: string
  typeLabel: string
  durationMin: number
  calories: number
  rolls: number
  subsFor: number
  subsAgainst: number
  feeling: number | null
  techniques: string[]
  photoUrl: string | null
  appUrl: string
  username: string
  template?: StoryTemplate
}

const FEELING_EMOJI: Record<number, string> = { 1:'😫',2:'😐',3:'🙂',4:'💪',5:'🔥' }
const W = 1080
const H = 1920
const BLOOD = '#9E0B13'
const VOLT  = '#DEFF9A'
const BG    = '#080808'
const SURF  = '#121212'
const INK   = '#F5F5F5'

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function setupCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  return { canvas, ctx }
}

async function drawAvatar(ctx: CanvasRenderingContext2D, d: StoryData, x: number, y: number, size: number) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2)
  ctx.clip()
  if (d.avatarUrl) {
    try {
      const av = await loadImage(d.avatarUrl)
      ctx.drawImage(av, x, y, size, size)
    } catch {
      ctx.fillStyle = BLOOD
      ctx.fillRect(x, y, size, size)
      ctx.fillStyle = 'white'
      ctx.font = `900 ${Math.floor(size * 0.5)}px Inter, -apple-system, sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(d.authorInitial, x + size/2, y + size/2 + 4)
    }
  } else {
    ctx.fillStyle = BLOOD
    ctx.fillRect(x, y, size, size)
    ctx.fillStyle = 'white'
    ctx.font = `900 ${Math.floor(size * 0.5)}px Inter, -apple-system, sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(d.authorInitial, x + size/2, y + size/2 + 4)
  }
  ctx.restore()
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, dark = false) {
  ctx.fillStyle = BLOOD
  roundRect(ctx, x, y, 100, 100, 26)
  ctx.fill()
  ctx.fillStyle = 'white'
  ctx.font = '900 56px Inter, -apple-system, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('道', x + 50, y + 55)
  ctx.textAlign = 'left'
  ctx.fillStyle = dark ? '#0A0A0A' : INK
  ctx.font = '900 60px Inter, -apple-system, sans-serif'
  ctx.fillText('MICHI', x + 120, y + 70)
}

function drawFooter(ctx: CanvasRenderingContext2D, d: StoryData, light = false) {
  ctx.textAlign = 'center'
  ctx.fillStyle = light ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)'
  ctx.font = '700 30px Inter, -apple-system, sans-serif'
  ctx.fillText(`michi.app/u/${d.username}`, W / 2, H - 80)
  ctx.fillStyle = BLOOD
  ctx.font = '900 24px Inter, -apple-system, sans-serif'
  ctx.fillText('DOMINE O TATAME.', W / 2, H - 130)
}

// ─────────── TEMPLATE: CLASSIC ───────────
async function drawClassic(d: StoryData): Promise<Blob> {
  const { canvas, ctx } = setupCanvas()

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, BG); bg.addColorStop(0.6, '#1A0006'); bg.addColorStop(1, BG)
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(158,11,19,0.18)'
  ctx.beginPath(); ctx.arc(W*1.1, H*0.1, 380, 0, Math.PI*2); ctx.fill()

  drawLogo(ctx, 80, 100)

  let photoBottom = 280
  if (d.photoUrl) {
    try {
      const photo = await loadImage(d.photoUrl)
      const pY = 280, pH = 720
      ctx.save()
      roundRect(ctx, 80, pY, W-160, pH, 36); ctx.clip()
      const ratio = photo.width / photo.height
      let dw = W-160, dh = (W-160)/ratio
      if (dh < pH) { dh = pH; dw = dh * ratio }
      ctx.drawImage(photo, 80 + (W-160-dw)/2, pY + (pH-dh)/2, dw, dh)
      ctx.restore()
      photoBottom = pY + pH + 40
    } catch {}
  }

  const athleteY = photoBottom + 30
  await drawAvatar(ctx, d, 80, athleteY, 120)

  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = INK
  ctx.font = '900 64px Inter, -apple-system, sans-serif'
  ctx.fillText(d.authorName, 230, athleteY + 60)
  ctx.fillStyle = d.beltColor
  roundRect(ctx, 230, athleteY + 80, 80, 22, 4); ctx.fill()
  ctx.font = '700 28px Inter, -apple-system, sans-serif'
  ctx.fillText(`Faixa ${d.beltName}${d.degrees > 0 ? ` · ${d.degrees}°` : ''}`, 330, athleteY + 100)

  const sY = athleteY + 180
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; roundRect(ctx, 80, sY, 450, 200, 28); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '900 22px Inter, sans-serif'
  ctx.fillText('DURAÇÃO', 110, sY + 50)
  ctx.fillStyle = INK; ctx.font = '900 110px Inter, sans-serif'
  ctx.fillText(`${d.durationMin}`, 110, sY + 165)
  ctx.fillStyle = 'rgba(245,245,245,0.5)'; ctx.font = '900 40px Inter, sans-serif'
  ctx.fillText('min', 110 + ctx.measureText(`${d.durationMin}`).width + 10, sY + 165)

  ctx.fillStyle = 'rgba(158,11,19,0.28)'; roundRect(ctx, 550, sY, 450, 200, 28); ctx.fill()
  ctx.fillStyle = 'rgba(255,180,180,0.7)'; ctx.font = '900 22px Inter, sans-serif'
  ctx.fillText('QUEIMADAS', 580, sY + 50)
  ctx.fillStyle = INK; ctx.font = '900 100px Inter, sans-serif'
  ctx.fillText(`${d.calories}`, 580, sY + 165)
  ctx.fillStyle = 'rgba(255,180,180,0.7)'; ctx.font = '900 36px Inter, sans-serif'
  ctx.fillText('kcal', 580 + ctx.measureText(`${d.calories}`).width + 10, sY + 165)

  const tY = sY + 240
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(ctx, 80, tY, 360, 80, 40); ctx.fill()
  ctx.fillStyle = INK; ctx.font = '900 36px Inter, sans-serif'
  ctx.fillText(`${d.typeEmoji}  ${d.typeLabel}`, 110, tY + 52)
  if (d.feeling) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(ctx, 460, tY, 240, 80, 40); ctx.fill()
    ctx.fillStyle = INK
    ctx.fillText(`${FEELING_EMOJI[d.feeling]}  ${d.feeling}/5`, 490, tY + 52)
  }

  drawFooter(ctx, d)
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob')), 'image/jpeg', 0.92))
}

// ─────────── TEMPLATE: MINIMAL ───────────
async function drawMinimal(d: StoryData): Promise<Blob> {
  const { canvas, ctx } = setupCanvas()
  ctx.fillStyle = '#FAFAFA'; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = BLOOD; ctx.fillRect(0, 0, 18, H)
  drawLogo(ctx, 100, 120, true)

  await drawAvatar(ctx, d, 100, 320, 140)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#0A0A0A'; ctx.font = '900 70px Inter, sans-serif'
  ctx.fillText(d.authorName, 270, 380)
  ctx.fillStyle = d.beltColor; roundRect(ctx, 270, 410, 90, 22, 4); ctx.fill()
  ctx.fillStyle = '#444'; ctx.font = '700 28px Inter, sans-serif'
  ctx.fillText(`Faixa ${d.beltName}`, 380, 430)

  // Big stat
  ctx.fillStyle = '#0A0A0A'
  ctx.font = '900 300px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${d.durationMin}`, W/2, 800)
  ctx.fillStyle = BLOOD; ctx.font = '900 64px Inter, sans-serif'
  ctx.fillText('MINUTOS NO TATAME', W/2, 880)

  // Divider
  ctx.fillStyle = '#E5E5E5'; ctx.fillRect(180, 960, W - 360, 2)

  // Secondary stats grid
  const items = [
    { v: `${d.calories}`, l: 'kcal' },
    { v: `${d.subsFor}`,  l: 'finalizações' },
    { v: `${d.rolls}`,    l: 'rolas' },
  ]
  items.forEach((it, i) => {
    const x = W/2 + (i - 1) * 320
    ctx.fillStyle = '#0A0A0A'; ctx.font = '900 90px Inter, sans-serif'
    ctx.fillText(it.v, x, 1130)
    ctx.fillStyle = '#666'; ctx.font = '700 26px Inter, sans-serif'
    ctx.fillText(it.l.toUpperCase(), x, 1180)
  })

  ctx.fillStyle = '#888'; ctx.font = '700 36px Inter, sans-serif'
  ctx.fillText(`${d.typeEmoji}  ${d.typeLabel}`, W/2, 1340)

  drawFooter(ctx, d, true)
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob')), 'image/jpeg', 0.92))
}

// ─────────── TEMPLATE: HYPE (volt explosion) ───────────
async function drawHype(d: StoryData): Promise<Blob> {
  const { canvas, ctx } = setupCanvas()
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H)

  // Radial volt burst
  const rg = ctx.createRadialGradient(W/2, H*0.45, 50, W/2, H*0.45, 900)
  rg.addColorStop(0, 'rgba(222,255,154,0.55)')
  rg.addColorStop(0.4, 'rgba(158,11,19,0.35)')
  rg.addColorStop(1, 'rgba(8,8,8,0)')
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H)

  // Diagonal slash
  ctx.save()
  ctx.translate(W/2, H/2); ctx.rotate(-Math.PI/12)
  ctx.fillStyle = VOLT
  ctx.fillRect(-W, -60, W*2, 120)
  ctx.restore()

  drawLogo(ctx, 80, 100)

  // BIG calories
  ctx.textAlign = 'center'
  ctx.fillStyle = '#0A0A0A'
  ctx.font = '900 380px Inter, sans-serif'
  ctx.fillText(`${d.calories}`, W/2, 780)
  ctx.fillStyle = '#0A0A0A'; ctx.font = '900 70px Inter, sans-serif'
  ctx.fillText('KCAL QUEIMADAS', W/2, 870)

  // Volt label
  ctx.fillStyle = VOLT
  roundRect(ctx, W/2 - 280, 1000, 560, 110, 55); ctx.fill()
  ctx.fillStyle = '#0A0A0A'; ctx.font = '900 56px Inter, sans-serif'
  ctx.fillText(`⚡ ${d.durationMin}min · ${d.typeLabel}`, W/2, 1070)

  // Subs trophy
  if (d.subsFor > 0) {
    ctx.fillStyle = INK; ctx.font = '900 220px Inter, sans-serif'
    ctx.fillText(`${d.subsFor}`, W/2, 1380)
    ctx.fillStyle = BLOOD; ctx.font = '900 50px Inter, sans-serif'
    ctx.fillText(d.subsFor === 1 ? 'FINALIZAÇÃO 🏆' : 'FINALIZAÇÕES 🏆', W/2, 1450)
  }

  ctx.textAlign = 'left'
  await drawAvatar(ctx, d, 80, H - 280, 100)
  ctx.fillStyle = INK; ctx.font = '900 44px Inter, sans-serif'
  ctx.fillText(d.authorName, 210, H - 230)
  ctx.fillStyle = 'rgba(245,245,245,0.6)'; ctx.font = '700 28px Inter, sans-serif'
  ctx.fillText(`Faixa ${d.beltName} · @${d.username}`, 210, H - 195)

  drawFooter(ctx, d)
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob')), 'image/jpeg', 0.92))
}

// ─────────── TEMPLATE: STATS (data-heavy) ───────────
async function drawStats(d: StoryData): Promise<Blob> {
  const { canvas, ctx } = setupCanvas()
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H)

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1
  for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(0, i*160); ctx.lineTo(W, i*160); ctx.stroke() }
  for (let i = 0; i < 7;  i++) { ctx.beginPath(); ctx.moveTo(i*160, 0); ctx.lineTo(i*160, H); ctx.stroke() }

  drawLogo(ctx, 80, 100)

  ctx.textAlign = 'left'
  ctx.fillStyle = INK; ctx.font = '900 90px Inter, sans-serif'
  ctx.fillText(d.authorName, 80, 360)
  ctx.fillStyle = d.beltColor; roundRect(ctx, 80, 390, 100, 26, 5); ctx.fill()
  ctx.fillStyle = INK; ctx.font = '700 34px Inter, sans-serif'
  ctx.fillText(`Faixa ${d.beltName}${d.degrees>0?` · ${d.degrees}°`:''} · ${d.typeLabel}`, 200, 415)

  // 4 big metric tiles
  const tiles = [
    { v: `${d.durationMin}`, u: 'min',  l: 'duração',      c: INK,   bg: SURF },
    { v: `${d.calories}`,    u: 'kcal', l: 'queimadas',    c: VOLT,  bg: '#1A2008' },
    { v: `${d.subsFor}`,     u: '',     l: 'finalizações', c: VOLT,  bg: SURF },
    { v: `${d.rolls}`,       u: '',     l: 'rolas',        c: BLOOD, bg: SURF },
  ]
  tiles.forEach((t, i) => {
    const x = 80 + (i % 2) * 470
    const y = 540 + Math.floor(i/2) * 380
    ctx.fillStyle = t.bg; roundRect(ctx, x, y, 440, 340, 32); ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '900 24px Inter, sans-serif'
    ctx.fillText(t.l.toUpperCase(), x + 30, y + 60)
    ctx.fillStyle = t.c; ctx.font = '900 170px Inter, sans-serif'
    ctx.fillText(t.v, x + 30, y + 240)
    if (t.u) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '900 40px Inter, sans-serif'
      ctx.fillText(t.u, x + 30 + ctx.measureText(t.v).width + 14, y + 240)
    }
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '700 22px Inter, sans-serif'
    ctx.fillText(`#${(i+1).toString().padStart(2,'0')}`, x + 360, y + 305)
  })

  // Techniques line
  if (d.techniques.length > 0) {
    const y = 1340
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '900 24px Inter, sans-serif'
    ctx.fillText('TÉCNICAS', 80, y)
    ctx.fillStyle = INK; ctx.font = '700 32px Inter, sans-serif'
    const tags = d.techniques.slice(0, 4).map(t => `#${t}`).join('  ')
    ctx.fillText(tags, 80, y + 50)
  }

  drawFooter(ctx, d)
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob')), 'image/jpeg', 0.92))
}

export async function generateStoryImage(d: StoryData): Promise<Blob> {
  switch (d.template) {
    case 'minimal': return drawMinimal(d)
    case 'hype':    return drawHype(d)
    case 'stats':   return drawStats(d)
    default:        return drawClassic(d)
  }
}

export const TEMPLATE_META: Record<StoryTemplate, { label: string; emoji: string; desc: string }> = {
  classic: { label: 'Clássico',  emoji: '🩸', desc: 'Foto + stats' },
  minimal: { label: 'Minimal',   emoji: '⚪', desc: 'Limpo, claro' },
  hype:    { label: 'Hype',      emoji: '⚡', desc: 'Volt explosion' },
  stats:   { label: 'Stats',     emoji: '📊', desc: 'Data poster' },
}

export async function shareToInstagramStories(blob: Blob, filename = 'michi-story.jpg') {
  const file = new File([blob], filename, { type: 'image/jpeg' })
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Meu treino no MICHI' })
      return { ok: true }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return { ok: false, cancelled: true }
      return { ok: false, error: 'share_failed' }
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { ok: true, downloaded: true }
}
