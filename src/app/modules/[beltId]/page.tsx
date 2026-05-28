'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { TechniqueCard } from '@/components/modules/TechniqueCard'
import { getCurriculumByBelt, BELTS } from '@/lib/curriculum'
import { useProgressStore } from '@/store/progress'
import { useUserStore } from '@/store/user'
import { createClient } from '@/lib/supabase/client'
import type { BeltId } from '@/lib/supabase/types'
import { use } from 'react'

interface Props { params: Promise<{ beltId: string }> }

export default function ModulesPage({ params }: Props) {
  const { beltId } = use(params)
  const curriculum = getCurriculumByBelt(beltId as BeltId)
  const { isCompleted, toggle, getCount, setCompleted } = useProgressStore()
  const { addXP } = useUserStore()
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({})
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})
  const belt = BELTS.find(b => b.id === beltId)

  // Sync completions from Supabase on mount
  useEffect(() => {
    async function syncFromSupabase() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('technique_completions')
        .select('belt_id, module_id, technique_name')
        .eq('user_id', user.id)
        .eq('belt_id', beltId)

      if (data) {
        const rows = data as { belt_id: string; module_id: string; technique_name: string }[]
        const keysToMark = rows.map(c =>
          `${c.belt_id}-${c.module_id}-${c.technique_name.replace(/\s/g, '_')}`
        )
        setCompleted(keysToMark)
      }
    }
    syncFromSupabase()
  }, [beltId, setCompleted])

  if (!curriculum || !belt) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[#666]">Faixa não encontrada.</p>
    </div>
  )

  function toggleModule(id: string) { setOpenModules(o => ({ ...o, [id]: !o[id] })) }
  function toggleCat(id: string) { setOpenCats(o => ({ ...o, [id]: !o[id] })) }

  async function handleComplete(bId: string, modId: string, techName: string, done: boolean) {
    const key = `${bId}-${modId}-${techName.replace(/\s/g, '_')}`
    toggle(key)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (done) {
      addXP(10)
      await (supabase.from('technique_completions') as ReturnType<typeof supabase.from>).insert({
        user_id: user.id,
        belt_id: bId,
        module_id: modId,
        technique_name: techName,
      } as never)
      // Update XP in profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('increment_xp', { user_id: user.id, amount: 10 }).catch(() => null)
    } else {
      await supabase
        .from('technique_completions')
        .delete()
        .eq('user_id', user.id)
        .eq('belt_id', bId)
        .eq('module_id', modId)
        .eq('technique_name', techName)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F4F0]">
      <div className="bg-white border-b border-[#E8E3DC] px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-6 h-6 rounded" style={{ background: belt.color }} />
        <h1 className="font-bold text-lg">Faixa {belt.name}</h1>
        <span className="text-xs text-[#666] ml-auto">{curriculum.modules.length} módulos</span>
      </div>
      <div className="p-4 space-y-2.5">
        {curriculum.modules.map(mod => {
          const totalTechs = mod.categories.reduce((a, c) => a + c.techniques.length, 0)
          const doneTechs = getCount(beltId, mod.id)
          const pct = totalTechs > 0 ? Math.round((doneTechs / totalTechs) * 100) : 0
          const isOpen = openModules[mod.id]
          return (
            <div key={mod.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-[#F7F4F0]" onClick={() => toggleModule(mod.id)}>
                <span className="text-2xl font-bold min-w-8" style={{ color: mod.color }}>{mod.number}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{mod.label}</div>
                  <div className="text-xs text-[#666] truncate">{mod.description}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold" style={{ color: mod.color }}>{pct}%</span>
                  <ChevronDown size={18} className={`text-[#AAA] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
              <div className="h-[3px] bg-[#F0EDE8]">
                <div className="h-full transition-all" style={{ width: `${pct}%`, background: mod.color }} />
              </div>
              {isOpen && (
                <div>
                  {mod.categories.map(cat => {
                    const catOpen = openCats[cat.id]
                    const catDone = cat.techniques.filter(t =>
                      isCompleted(`${beltId}-${mod.id}-${t.name.replace(/\s/g, '_')}`)
                    ).length
                    return (
                      <div key={cat.id} className="border-t border-[#E8E3DC]">
                        <div className="flex items-center gap-2.5 px-4 py-3 cursor-pointer bg-white active:bg-[#F7F4F0]" onClick={() => toggleCat(cat.id)}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cat.bgColor }}>
                            <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                          </div>
                          <span className="flex-1 text-sm font-semibold text-[#1A1A2E]">{cat.name}</span>
                          <span className="text-xs text-[#666]">{catDone}/{cat.techniques.length}</span>
                          <span className="text-xs font-bold" style={{ color: cat.color }}>
                            {cat.techniques.length > 0 ? Math.round((catDone / cat.techniques.length) * 100) : 0}%
                          </span>
                          <ChevronDown size={14} className={`text-[#AAA] transition-transform ${catOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {catOpen && (
                          <div className="bg-[#F7F4F0]">
                            {cat.techniques.map((tech, i) => (
                              <TechniqueCard
                                key={tech.name}
                                technique={tech}
                                moduleColor={mod.color}
                                index={i}
                                isDone={isCompleted(`${beltId}-${mod.id}-${tech.name.replace(/\s/g, '_')}`)}
                                onComplete={(done) => handleComplete(beltId, mod.id, tech.name, done)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
