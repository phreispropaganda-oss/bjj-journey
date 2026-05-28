'use client'

import { useState, useEffect, useRef } from 'react'

export function useTimer(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { setRunning(false); return 0 }
          return s - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, seconds])

  function start(mins?: number) {
    if (mins) setSeconds(mins * 60)
    setRunning(true)
  }

  function pause() { setRunning(false) }

  function reset(mins?: number) {
    setRunning(false)
    setSeconds(mins ? mins * 60 : initialSeconds)
  }

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return { seconds, display, running, start, pause, reset }
}
