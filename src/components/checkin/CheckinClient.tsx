'use client'

import { useEffect, useRef, useState } from 'react'
import { findNearby, startVisit, endVisit, convertVisit } from '@/app/checkin/actions'

type Nearby = { id: string; name: string; distance_m: number; radius_meters: number; inside: boolean }
type OpenVisit = { id: string; academyId: string; academyName: string; enteredAt: string }
type QrAcademy = { id: string; name: string; latitude: number | null; longitude: number | null; radius_meters: number } | null
type HistRow = { id: string; entered_at: string; duration_min: number; source: string; session_id: string | null; academy_name: string }

interface Props {
  openVisit: OpenVisit | null
  qrAcademy: QrAcademy
  history: HistRow[]
}

const MIN_AUTO_SESSION = 25 // PRD: 25min para sugerir sessão

export default function CheckinClient({ openVisit, qrAcademy, history }: Props) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoError, setGeoError] = useState('')
  const [nearby, setNearby] = useState<Nearby[]>([])
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [feedback, setFeedback] = useState('')
  const [askConvert, setAskConvert] = useState<{ visitId: string; min: number } | null>(null)
  const [sessionType, setSessionType] = useState('gi')
  const watchId = useRef<number | null>(null)

  // Ticker para timer
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(i)
  }, [])

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) { setGeoError('GPS indisponível'); return }
    watchId.current = navigator.geolocation.watchPosition(
      p => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setGeoError('') },
      err => setGeoError(err.message),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    )
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current) }
  }, [])

  // Buscar academias próximas quando GPS muda
  useEffect(() => {
    if (!coords) return
    findNearby(coords.lat, coords.lng, 5000).then(setNearby)
  }, [coords])

  const elapsedMin = openVisit
    ? Math.max(0, Math.floor((now - new Date(openVisit.enteredAt).getTime()) / 60000))
    : 0

  async function doCheckin(academyId: string, source: 'gps' | 'qr' | 'manual') {
    setBusy(true); setFeedback('')
    const r = await startVisit(academyId, source, coords?.lat, coords?.lng)
    setBusy(false)
    if (r.error) { setFeedback(`⚠️ ${r.error}`); return }
    setFeedback('✓ Check-in realizado')
    location.reload()
  }

  async function doCheckout() {
    if (!openVisit) return
    setBusy(true)
    const r = await endVisit(openVisit.id)
    setBusy(false)
    if (r.error) { setFeedback(`⚠️ ${r.error}`); return }
    if ((r.minutes ?? 0) >= MIN_AUTO_SESSION) {
      setAskConvert({ visitId: openVisit.id, min: r.minutes! })
    } else {
      setFeedback(`✓ Check-out · ${r.minutes}min`)
      setTimeout(() => location.reload(), 1200)
    }
  }

  async function doConvert(convert: boolean) {
    if (!askConvert) return
    if (!convert) { setAskConvert(null); location.reload(); return }
    setBusy(true)
    const r = await convertVisit(askConvert.visitId, sessionType, 'Check-in automatico')
    setBusy(false)
    if (r.error) { setFeedback(`⚠️ ${r.error}`); return }
    setFeedback('✓ Treino criado a partir do check-in')
    setTimeout(() => { window.location.href = `/treino/${r.sessionId}/share` }, 800)
  }

  // QR auto-prompt
  const qrInside = qrAcademy && coords && qrAcademy.latitude != null && qrAcademy.longitude != null
    ? haversine(coords.lat, coords.lng, qrAcademy.latitude, qrAcademy.longitude) <= qrAcademy.radius_meters + 50
    : true

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="bg-blood/15 border border-blood/30 text-blood px-3 py-2 rounded-xl text-sm font-bold">
          {feedback}
        </div>
      )}

      {/* Visita aberta */}
      {openVisit && !askConvert && (
        <div className="card-elev bg-volt/5 border-volt/30">
          <p className="text-[10px] font-black uppercase tracking-wider text-volt mb-1">No tatame</p>
          <p className="font-display text-ink-primary text-2xl">{openVisit.academyName}</p>
          <p className="text-ink-secondary text-sm mt-1">
            ⏱ {elapsedMin}min desde {new Date(openVisit.enteredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <button onClick={doCheckout} disabled={busy}
            className="mt-4 w-full bg-blood text-ink-primary font-black py-3 rounded-full text-sm disabled:opacity-40">
            {busy ? 'Encerrando...' : 'Encerrar check-in'}
          </button>
          {elapsedMin >= MIN_AUTO_SESSION && (
            <p className="text-[10px] text-volt mt-2 text-center">
              Ao encerrar, vamos sugerir criar um treino automático ({elapsedMin}min ≥ {MIN_AUTO_SESSION}min)
            </p>
          )}
        </div>
      )}

      {/* Convert prompt */}
      {askConvert && (
        <div className="card-elev space-y-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary">Criar treino?</p>
          <p className="text-ink-primary text-sm">
            Você ficou <strong className="text-volt">{askConvert.min}min</strong> na academia.
            Vamos criar um treino registrado para essa visita?
          </p>
          <div>
            <label className="text-xs text-ink-secondary block mb-1">Tipo do treino</label>
            <select value={sessionType} onChange={e => setSessionType(e.target.value)} className="field-input">
              <option value="gi">🥋 Gi</option>
              <option value="no_gi">👕 No-Gi</option>
              <option value="drilling">🔁 Drilling</option>
              <option value="competition">🏆 Competição</option>
              <option value="open_mat">🤝 Open Mat</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => doConvert(false)} disabled={busy}
              className="flex-1 bg-brand-elev text-ink-secondary font-black py-3 rounded-full text-xs">
              Só encerrar
            </button>
            <button onClick={() => doConvert(true)} disabled={busy}
              className="flex-1 bg-volt text-brand-bg font-black py-3 rounded-full text-xs disabled:opacity-40">
              {busy ? 'Criando...' : 'Criar treino'}
            </button>
          </div>
        </div>
      )}

      {/* QR de uma academia */}
      {qrAcademy && !openVisit && !askConvert && (
        <div className={`card-elev ${qrInside ? 'border-volt/40 bg-volt/5' : 'border-amber-400/30 bg-amber-400/5'}`}>
          <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary">QR Code · {qrAcademy.name}</p>
          <p className="text-ink-primary text-sm mt-1">
            {qrInside
              ? '✓ Você está dentro da área da academia'
              : '⚠️ Você não parece estar na academia, mas pode confirmar manualmente'}
          </p>
          <button onClick={() => doCheckin(qrAcademy.id, 'qr')} disabled={busy}
            className="mt-3 w-full btn-primary disabled:opacity-40">
            {busy ? 'Confirmando...' : 'Confirmar check-in'}
          </button>
        </div>
      )}

      {/* GPS / nearby */}
      {!openVisit && !askConvert && !qrAcademy && (
        <div className="card-elev space-y-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary">📍 Academias próximas</p>
          {!coords && !geoError && <p className="text-ink-secondary text-sm">Procurando GPS...</p>}
          {geoError && (
            <p className="text-amber-400 text-sm">⚠️ {geoError}. Use a busca manual ou um QR.</p>
          )}
          {coords && nearby.length === 0 && (
            <p className="text-ink-secondary text-sm">Nenhuma academia em 5km do seu GPS. Tente check-in manual ou QR.</p>
          )}
          {nearby.map(a => (
            <div key={a.id} className="flex items-center gap-3 bg-brand-bg rounded-xl p-3 border border-brand-elev">
              <div className="flex-1 min-w-0">
                <p className="text-ink-primary font-bold text-sm">{a.name}</p>
                <p className="text-[10px] text-ink-muted">
                  {a.distance_m < 1000 ? `${a.distance_m}m` : `${(a.distance_m/1000).toFixed(1)}km`}
                  {a.inside && <span className="text-volt"> · dentro do raio</span>}
                </p>
              </div>
              <button onClick={() => doCheckin(a.id, a.inside ? 'gps' : 'manual')} disabled={busy}
                className={`text-xs font-black px-4 py-2 rounded-full min-h-tap ${
                  a.inside ? 'bg-volt text-brand-bg' : 'bg-brand-elev text-ink-primary'
                } disabled:opacity-40`}>
                {a.inside ? 'Entrar' : 'Manual'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Histórico */}
      {history.length > 0 && (
        <div className="card-elev">
          <p className="text-[10px] font-black uppercase tracking-wider text-ink-secondary mb-2">Histórico</p>
          <div className="space-y-1.5">
            {history.map(h => (
              <div key={h.id} className="flex items-center gap-2 text-xs">
                <span className="text-ink-muted w-20">{new Date(h.entered_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                <span className="text-ink-primary flex-1 truncate">{h.academy_name}</span>
                <span className="text-ink-secondary">{h.duration_min}min</span>
                {h.session_id && <span className="text-volt">✓</span>}
                <span className="text-[9px] text-ink-muted uppercase">{h.source}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-ink-muted text-center">
        🛡️ GPS só é usado para identificar a academia. Visitas ≥ {MIN_AUTO_SESSION}min viram treino automático (opcional).
      </p>
    </div>
  )
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = 6371000
  const toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2
  return 2 * r * Math.asin(Math.sqrt(a))
}
