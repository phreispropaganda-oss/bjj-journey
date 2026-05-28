'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { enableStudentView, disableStudentView } from '@/lib/view-mode'

export default function ViewAsStudentToggle({
  active, variant = 'dark',
}: { active: boolean; variant?: 'dark' | 'light' }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      if (active) await disableStudentView()
      else        await enableStudentView()
      router.push('/dashboard')
      router.refresh()
    })
  }

  if (active) {
    // Yellow banner — visible everywhere
    return (
      <button onClick={toggle} disabled={pending}
        className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-black px-4 py-2.5 text-xs flex items-center justify-center gap-2 transition-colors">
        <span>👁️</span>
        <span>Visualizando como aluno · Toque para voltar ao modo admin</span>
      </button>
    )
  }

  const colors = variant === 'dark'
    ? 'bg-[#222] border-[#333] text-white hover:bg-[#2A2A2A]'
    : 'bg-white border-[#E5E5E5] text-[#0D0D0D] hover:bg-[#F8F7F5]'

  return (
    <button onClick={toggle} disabled={pending}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${colors}`}>
      <span>👁️</span>
      <span>{pending ? '...' : 'Ver como aluno'}</span>
    </button>
  )
}
