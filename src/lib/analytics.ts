'use client'

import posthog from 'posthog-js'

let initialized = false

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    persistence: 'localStorage',
  })
  initialized = true
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (!initialized) initAnalytics()
  if (initialized) posthog.identify(userId, props)
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!initialized) initAnalytics()
  if (initialized) posthog.capture(event, props)
}

export function resetAnalytics() {
  if (initialized) posthog.reset()
}
