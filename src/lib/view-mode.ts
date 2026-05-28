'use server'

import { cookies } from 'next/headers'

const COOKIE_NAME = 'belt-rise-view-as-student'

/** Returns true if the user has explicitly chosen to view as student.
 *  Used to bypass owner/admin powers on a per-session basis. */
export async function isViewingAsStudent(): Promise<boolean> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value === '1'
}

export async function enableStudentView() {
  const store = await cookies()
  store.set(COOKIE_NAME, '1', {
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
    sameSite: 'lax',
  })
}

export async function disableStudentView() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
