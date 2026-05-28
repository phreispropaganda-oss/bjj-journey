'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [running, setRunning] = useState(false)
  // Keep running in a ref so the interval callback doesn't create stale closures
  const runningRef = useRef(running)
  runningRef.current = running

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running]) // only re-run when running changes, not every tick

  const start = useCallback((mins?: number) => {
    if (mins) setSeconds(mins * 60)
    setRunning(true)
  }, [])

  const pause = useCallback(() => setRunning(false), [])

  const reset = useCallback((mins?: number) => {
    setRunning(false)
    setSeconds(mins ? mins * 60 : initialSeconds)
  }, [initialSeconds])

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return { seconds, display, running, start, pause, reset }
}
