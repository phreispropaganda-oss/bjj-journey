import type { Metadata, Viewport } from 'next'
import './globals.css'
import StudentViewBanner from '@/components/ui/StudentViewBanner'
import AnalyticsBoot from '@/components/AnalyticsBoot'
import { ConfirmProvider } from '@/components/ui/ConfirmDialog'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Belt Rise — Treine. Suba. Conquiste.',
  description: 'Plataforma de evolução para lutadores. Treinos, progresso de faixa, comunidade e legado marcial.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Belt Rise',
  },
  openGraph: {
    title: 'Belt Rise — Treine. Suba. Conquiste.',
    description: 'Sua jornada no Jiu-Jitsu, rastreada com a precisão do Strava.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#080808',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let userId: string | undefined
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id
  } catch { /* anonymous */ }

  return (
    <html lang="pt-BR" data-theme="dark">
      <head>
        {/* Theme inline ANTES do paint para evitar flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var m = localStorage.getItem('belt_rise_theme') || 'system';
              var r = m === 'system'
                ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
                : m;
              document.documentElement.setAttribute('data-theme', r);
              document.documentElement.style.colorScheme = r;
            } catch (e) {}
          })();
        `}} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Barlow+Condensed:wght@500;600;700;800;900&family=Barlow:wght@400;500;600;700&family=Urbanist:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="max-w-[480px] mx-auto min-h-screen bg-brand-bg text-ink-primary">
        <ThemeProvider>
          <ConfirmProvider>
            <StudentViewBanner />
            <AnalyticsBoot userId={userId} />
            {children}
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
