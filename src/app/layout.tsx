import type { Metadata, Viewport } from 'next'
import './globals.css'
import StudentViewBanner from '@/components/ui/StudentViewBanner'
import AnalyticsBoot from '@/components/AnalyticsBoot'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'MICHI — Domine o tatame',
  description: 'Plataforma global de evolução para lutadores. Treinos, técnicas, comunidade e legado marcial.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MICHI',
  },
  openGraph: {
    title: 'MICHI — Domine o tatame',
    description: 'Treinar é mais do que vencer. É voltar.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#080808',  // PRD §2.1 — bg base
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let userId: string | undefined
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id
  } catch { /* anonymous */ }

  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* PRD §2.2 — Tipografia */}
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Urbanist:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* PWA iOS */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="max-w-[480px] mx-auto min-h-screen bg-brand-bg text-ink-primary">
        <StudentViewBanner />
        <AnalyticsBoot userId={userId} />
        {children}
      </body>
    </html>
  )
}
