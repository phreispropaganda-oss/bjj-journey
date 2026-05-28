import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BELTS } from '@/lib/curriculum'
import { ShareButton } from '@/components/profile/ShareButton'
import Link from 'next/link'

interface Props { params: Promise<{ username: string }> }

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bjj.app'
  return (
    <div className="min-h-screen bg-[#F7F4F0]">
      <div className="p-4">
        <h1 className="text-xl font-bold">{username} no BJJ Journey</h1>
        <ShareButton username={username} appUrl={appUrl} />
        <div className="mt-4">
          <Link href="/login" className="btn-primary inline-block text-center">
            Criar conta grátis
          </Link>
        </div>
      </div>
    </div>
  )
}
