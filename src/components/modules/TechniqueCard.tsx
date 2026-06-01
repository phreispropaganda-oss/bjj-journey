'use client'

import { useState } from 'react'
import { ChevronDown, AlertCircle, Lightbulb, Timer, CheckCircle, Circle, ExternalLink } from 'lucide-react'
import { useTimer } from '@/hooks/useTimer'
import type { Technique } from '@/lib/curriculum'

interface Props {
  technique: Technique
  moduleColor: string
  onComplete: (done: boolean) => void
  isDone: boolean
  index: number
}

function XPToast({ show }: { show: boolean }) {
  return (
    <div className={`fixed top-14 right-4 z-50 flex items-center gap-2 bg-white border border-yellow-400
      rounded-xl px-3 py-2 text-sm font-semibold text-yellow-600 shadow-lg pointer-events-none
      transition-transform duration-300 ${show ? 'translate-x-0' : 'translate-x-[200%]'}`}>
      ⚡ +10 XP
    </div>
  )
}

function TimerButton({ minutes, color }: { minutes: number; color: string }) {
  const timer = useTimer(minutes * 60)
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => { timer.start(minutes); setOpen(true) }}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border border-[#DDD8D0] bg-white text-ink-secondary hover:bg-[#F0EDE8] transition-colors">
        <Timer size={12} />
        {minutes}min
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/85 z-50 flex flex-col items-center justify-center gap-5">
          <p className="text-white text-sm font-semibold">Temporizador</p>
          <div className="w-44 h-44 rounded-full border-4 flex flex-col items-center justify-center" style={{ borderColor: color }}>
            <span className="text-5xl font-bold tabular-nums" style={{ color }}>{timer.display}</span>
            <span className="text-xs text-[#999] mt-1">restante</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => timer.pause()}
              className="px-5 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white text-sm font-semibold">
              {timer.running ? 'Pausar' : 'Retomar'}
            </button>
            <button onClick={() => { timer.reset(minutes); setOpen(false) }}
              className="px-5 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white text-sm font-semibold">
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export function TechniqueCard({ technique, moduleColor, onComplete, isDone, index }: Props) {
  const [open, setOpen] = useState(false)
  const [xpShow, setXpShow] = useState(false)

  function handleComplete() {
    if (!isDone) {
      setXpShow(true)
      setTimeout(() => setXpShow(false), 2200)
    }
    onComplete(!isDone)
  }

  return (
    <>
      <XPToast show={xpShow} />
      <div className={`border-t border-[#E8E3DC] ${isDone ? 'opacity-70' : ''}`}>
        <div className="flex items-center gap-2.5 px-3.5 py-3 cursor-pointer active:bg-[#F7F4F0]" onClick={() => setOpen(o => !o)}>
          <span className="text-xs text-ink-muted min-w-[18px] tabular-nums">{index + 1}</span>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: moduleColor }} />
          <span className="flex-1 text-sm font-medium text-ink-primary leading-snug">{technique.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${isDone ? 'bg-green-100 text-green-700' : 'bg-[#F0EDE8] text-ink-muted'}`}>
            {isDone ? '✓ feito' : 'pendente'}
          </span>
          <ChevronDown size={14} className={`text-ink-muted transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
        </div>
        {open && (
          <div className="px-3.5 pb-4 pt-0 bg-[#F7F4F0] border-t border-[#E8E3DC]">
            <div className="bg-[#F0EDE8] rounded-lg px-3 py-2.5 my-2.5 text-xs text-ink-secondary leading-relaxed border-l-2" style={{ borderColor: moduleColor }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block mb-1">Posição de entrada</span>
              {technique.entryPosition}
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed mb-2.5">{technique.description}</p>
            <div className="space-y-1.5 mb-2.5">
              {technique.steps.map((step, i) => (
                <div key={i} className="flex gap-2.5 text-xs text-ink-primary leading-relaxed">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 mt-0.5 text-white" style={{ background: moduleColor }}>
                    {i + 1}
                  </div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-start bg-red-50 border border-red-200 rounded-lg p-2.5 mb-2 text-xs text-ink-secondary leading-relaxed">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <span>{technique.commonMistake}</span>
            </div>
            <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3 text-xs text-ink-secondary leading-relaxed">
              <Lightbulb size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{technique.tip}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <TimerButton minutes={3} color={moduleColor} />
              <TimerButton minutes={5} color={moduleColor} />
              <TimerButton minutes={10} color={moduleColor} />
              <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(technique.youtubeQuery)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border border-[#DDD8D0] bg-white text-ink-secondary hover:bg-[#F0EDE8] transition-colors">
                <ExternalLink size={12} /> YouTube
              </a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(technique.name + ' jiu jitsu')}&tbm=isch`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border border-[#DDD8D0] bg-white text-ink-secondary hover:bs-[#F0EDE8] transition-colors">
                <ExternalLink size={12} /> Imagens
              </a>
              <button onClick={handleComplete}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ml-auto ${
                  isDone ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-[#DDD8D0] text-ink-secondary hover:border-[#FF6B2B] hover:text-rise'
                }`}>
                {isDone ? <CheckCircle size={13} /> : <Circle size={13} />}
                {isDone ? 'Feito!' : 'Marcar como feito'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
