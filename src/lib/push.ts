'use client'

const VAPID_PUB = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
}

export async function subscribeToPush(): Promise<{ ok: boolean; reason?: string }> {
  if (typeof window === 'undefined') return { ok: false, reason: 'no_window' }
  if (!('serviceWorker' in navigator)) return { ok: false, reason: 'no_sw' }
  if (!('PushManager' in window))     return { ok: false, reason: 'no_push' }
  if (!VAPID_PUB)                     return { ok: false, reason: 'no_vapid_key' }

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return { ok: false, reason: 'denied' }

  const reg = await navigator.serviceWorker.register('/sw-push.js')
  await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUB),
  })

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub.toJSON()),
  })
  if (!res.ok) return { ok: false, reason: 'server_failed' }
  return { ok: true }
}
