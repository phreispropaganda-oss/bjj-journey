/* MICHI service worker for Web Push */
self.addEventListener('push', (event) => {
  if (!event.data) return
  let data
  try { data = event.data.json() } catch { data = { title: 'MICHI', body: event.data.text() } }
  const title = data.title ?? 'MICHI'
  const opts = {
    body:  data.body ?? '',
    icon:  data.icon ?? '/icons/icon-192.png',
    badge: data.badge ?? '/icons/icon-192.png',
    data:  { url: data.url ?? '/' },
    tag:   data.tag ?? 'michi',
  }
  event.waitUntil(self.registration.showNotification(title, opts))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus().then(() => c.navigate(url))
      }
      return clients.openWindow(url)
    })
  )
})
