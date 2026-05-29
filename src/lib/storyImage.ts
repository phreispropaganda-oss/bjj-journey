// Generate a 9:16 image (1080x1920) for Instagram Stories from training session data
// Uses Canvas 2D for client-side rendering — no server cost

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
}

const FEELING_EMOJI: Record<number, string> = { 1:'😫',2:'😐',3:'🙂',4:'💪',5:'🔥' }

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
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

export async function generateStoryImage(d: StoryData): Promise<Blob> {
  const W = 1080
  const H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  // ── Background (dark with red accent) ──
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#080808')
  bg.addColorStop(0.6, '#1A0000')
  bg.addColorStop(1, '#080808')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Red accent circles
  ctx.fillStyle = 'rgba(204,0,0,0.18)'
  ctx.beginPath()
  ctx.arc(W * 1.1, H * 0.1, 380, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(204,0,0,0.10)'
  ctx.beginPath()
  ctx.arc(-100, H * 0.85, 320, 0, Math.PI * 2)
  ctx.fill()

  // ── Logo top ──
  ctx.fillStyle = '#CC0000'
  roundRect(ctx, 80, 100, 110, 110, 28)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 44px Inter, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('BR', 80 + 55, 100 + 60)
  ctx.textAlign = 'left'
  ctx.font = '900 52px Inter, -apple-system, sans-serif'
  ctx.fillText('Belt Rise', 215, 165)

  // ── Photo (if available) ──
  let photoBottom = 300
  if (d.photoUrl) {
    try {
      const photo = await loadImage(d.photoUrl)
      const photoH = 720
      const photoY = 280
      ctx.save()
      roundRect(ctx, 80, photoY, W - 160, photoH, 36)
      ctx.clip()
      // Cover behavior
      const ratio = photo.width / photo.height
      const targetW = W - 160
      let drawW = targetW
      let drawH = targetW / ratio
      if (drawH < photoH) { drawH = photoH; drawW = drawH * ratio }
      const dx = 80 + (targetW - drawW) / 2
      const dy = photoY + (photoH - drawH) / 2
      ctx.drawImage(photo, dx, dy, drawW, drawH)
      ctx.restore()
      photoBottom = photoY + photoH + 40
    } catch { /* skip photo on error */ }
  }

  // ── Athlete row ──
  const athleteY = photoBottom + 30
  // Avatar
  ctx.save()
  ctx.beginPath()
  ctx.arc(80 + 60, athleteY + 60, 60, 0, Math.PI * 2)
  ctx.clip()
  if (d.avatarUrl) {
    try {
      const av = await loadImage(d.avatarUrl)
      ctx.drawImage(av, 80, athleteY, 120, 120)
    } catch {
      ctx.fillStyle = '#CC0000'
      ctx.fillRect(80, athleteY, 120, 120)
    }
  } else {
    ctx.fillStyle = '#CC0000'
    ctx.fillRect(80, athleteY, 120, 120)
    ctx.fillStyle = 'white'
    ctx.font = '900 56px Inter, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(d.authorInitial, 80 + 60, athleteY + 65)
  }
  ctx.restore()

  // Name + belt
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = 'white'
  ctx.font = '900 64px Inter, -apple-system, sans-serif'
  ctx.fillText(d.authorName, 230, athleteY + 60)

  // Belt bar
  ctx.fillStyle = d.beltColor
  roundRect(ctx, 230, athleteY + 80, 80, 22, 4)
  ctx.fill()
  ctx.fillStyle = d.beltColor
  ctx.font = '700 28px Inter, -apple-system, sans-serif'
  ctx.fillText(`Faixa ${d.beltName}${d.degrees > 0 ? ` · ${d.degrees}°` : ''}`, 330, athleteY + 100)

  // ── Big stats: duration + calories ──
  const statsY = athleteY + 180
  // Card 1: duration
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  roundRect(ctx, 80, statsY, 450, 200, 28)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '900 22px Inter, -apple-system, sans-serif'
  ctx.fillText('DURAÇÃO', 110, statsY + 50)
  ctx.fillStyle = 'white'
  ctx.font = '900 110px Inter, -apple-system, sans-serif'
  ctx.fillText(`${d.durationMin}`, 110, statsY + 165)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '900 40px Inter, -apple-system, sans-serif'
  const durTxtW = ctx.measureText(`${d.durationMin}`).width
  ctx.fillText('min', 110 + durTxtW + 10, statsY + 165)

  // Card 2: calories
  ctx.fillStyle = 'rgba(204,0,0,0.25)'
  roundRect(ctx, 550, statsY, 450, 200, 28)
  ctx.fill()
  ctx.strokeStyle = 'rgba(204,0,0,0.4)'
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,204,204,0.7)'
  ctx.font = '900 22px Inter, -apple-system, sans-serif'
  ctx.fillText('QUEIMADAS', 580, statsY + 50)
  ctx.fillStyle = 'white'
  ctx.font = '900 100px Inter, -apple-system, sans-serif'
  ctx.fillText(`${d.calories}`, 580, statsY + 165)
  ctx.fillStyle = 'rgba(255,204,204,0.7)'
  ctx.font = '900 36px Inter, -apple-system, sans-serif'
  const calTxtW = ctx.measureText(`${d.calories}`).width
  ctx.fillText('kcal', 580 + calTxtW + 10, statsY + 165)

  // ── Tags row: type + feeling ──
  const tagY = statsY + 240
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundRect(ctx, 80, tagY, 320, 80, 40)
  ctx.fill()
  ctx.fillStyle = 'white'
  ctx.font = '900 36px Inter, -apple-system, sans-serif'
  ctx.fillText(`${d.typeEmoji}  ${d.typeLabel}`, 110, tagY + 52)

  if (d.feeling) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    roundRect(ctx, 420, tagY, 280, 80, 40)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.font = '900 36px Inter, -apple-system, sans-serif'
    ctx.fillText(`${FEELING_EMOJI[d.feeling]}  ${d.feeling}/5`, 450, tagY + 52)
  }

  // ── Performance row (if data) ──
  if (d.rolls > 0 || d.subsFor > 0 || d.subsAgainst > 0) {
    const perfY = tagY + 130
    const items = [
      { value: d.rolls,        label: 'Rolas',     color: '#FFCCCC' },
      { value: d.subsFor,      label: 'Finalizei', color: '#86EFAC' },
      { value: d.subsAgainst,  label: 'Sofridos',  color: '#FCD34D' },
    ]
    const cardW = (W - 200) / 3
    items.forEach((it, i) => {
      const x = 80 + i * (cardW + 20)
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      roundRect(ctx, x, perfY, cardW, 140, 24)
      ctx.fill()
      ctx.textAlign = 'center'
      ctx.fillStyle = it.color
      ctx.font = '900 64px Inter, -apple-system, sans-serif'
      ctx.fillText(`${it.value}`, x + cardW / 2, perfY + 80)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '900 22px Inter, -apple-system, sans-serif'
      ctx.fillText(it.label.toUpperCase(), x + cardW / 2, perfY + 115)
    })
    ctx.textAlign = 'left'
  }

  // ── Footer: URL ──
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font = '700 30px Inter, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`belt-rise.app/u/${d.username}`, W / 2, H - 80)

  // Tagline
  ctx.fillStyle = 'rgba(204,0,0,0.8)'
  ctx.font = '900 26px Inter, -apple-system, sans-serif'
  ctx.fillText('DOMINE O TATAME.', W / 2, H - 130)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.92)
  })
}

export async function shareToInstagramStories(blob: Blob, filename = 'belt-rise-story.jpg') {
  const file = new File([blob], filename, { type: 'image/jpeg' })

  // Use Web Share API with File support if available (mobile Safari/Chrome)
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Meu treino no Belt Rise' })
      return { ok: true }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return { ok: false, cancelled: true }
      return { ok: false, error: 'share_failed' }
    }
  }

  // Fallback: download the image
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { ok: true, downloaded: true }
}
