'use client'

import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'

interface Props {
  username: string
  appUrl: string
}

export function ShareButton({ username, appUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const profileUrl = `${appUrl}/u/${username}`

  async function copyLink() {
    await navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-[#666] mb-3">Compartilhar perfil</p>
    </div>
  )
}
