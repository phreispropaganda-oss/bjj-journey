'use client'

import { useEffect, useState } from 'react'

export function usePushNotifications() {
  return { permission: 'default', subscription: null }
}
