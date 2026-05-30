'use client'

import { useState, useRef, useEffect } from 'react'

// PRD §2.1 — Voice-to-text com Web Speech API
// Fallback para textarea normal se não suportado.

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
}

interface SpeechRecognitionType extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: { results: { transcript: string; isFinal: boolean }[][] & { length: number } }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionType
    webkitSpeechRecognition?: new () => SpeechRecognitionType
  }
}

export default function VoiceNoteInput({
  value, onChange, placeholder, rows = 3, maxLength = 500,
}: Props) {
  const [recording, setRecording] = useState(false)
  const [supported, setSupported] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef<SpeechRecognitionType | null>(null)
  const initialValueRef = useRef('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const Recog = window.SpeechRecognition ?? window.webkitSpeechRecognition
    setSupported(!!Recog)
  }, [])

  function start() {
    if (recording) return
    const Recog = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Recog) { setError('Reconhecimento de voz não suportado neste navegador'); return }

    initialValueRef.current = value ? value + ' ' : ''
    const r = new Recog()
    r.lang = 'pt-BR'
    r.continuous = true
    r.interimResults = true

    r.onresult = (e) => {
      let transcript = initialValueRef.current
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i] as unknown as { 0: { transcript: string }; isFinal: boolean }
        transcript += result[0].transcript
      }
      if (transcript.length <= maxLength) onChange(transcript)
    }
    r.onerror = (e) => {
      setError(e.error === 'no-speech' ? 'Não ouvimos nada, tente de novo' : 'Erro: ' + e.error)
      setRecording(false)
    }
    r.onend = () => setRecording(false)

    try {
      r.start()
      recognitionRef.current = r
      setRecording(true)
      setError('')
      if (navigator.vibrate) navigator.vibrate(30)
    } catch {
      setError('Permita acesso ao microfone')
    }
  }

  function stop() {
    recognitionRef.current?.stop()
    setRecording(false)
    if (navigator.vibrate) navigator.vibrate([20, 30, 20])
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          className="field-input pr-12"
          rows={rows}
          placeholder={placeholder ?? 'O que aprendeu hoje? Pontos a melhorar...'}
          value={value}
          onChange={e => onChange(e.target.value)}
          maxLength={maxLength}
        />

        {supported && (
          <button
            type="button"
            onClick={recording ? stop : start}
            aria-label={recording ? 'Parar gravação' : 'Gravar nota por voz'}
            className={`absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center
              transition-all ${
              recording
                ? 'bg-blood text-ink-primary shadow-glow-blood animate-pulse'
                : 'bg-brand-elev text-ink-secondary border border-border hover:bg-brand-hover'
            }`}
          >
            <span className="text-lg">{recording ? '⏹' : '🎙'}</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span className="text-ink-muted">
          {recording && '🔴 Gravando…  '}
          {supported && !recording && 'Toque no 🎙 para ditar'}
        </span>
        <span className={`font-bold ${value.length > maxLength * 0.9 ? 'text-blood' : 'text-ink-muted'}`}>
          {value.length}/{maxLength}
        </span>
      </div>

      {error && (
        <p className="text-[10px] text-blood">⚠️ {error}</p>
      )}
    </div>
  )
}
