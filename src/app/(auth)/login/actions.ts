'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signInWithMagicLink(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function signUpWithPassword(formData: FormData) {
  const supabase = await createClient()
  const email    = (formData.get('email')    as string).trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Email e senha são obrigatórios' }
  if (password.length < 6)  return { error: 'A senha precisa ter no mínimo 6 caracteres' }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function signInWithPassword(formData: FormData) {
  const supabase = await createClient()
  const email    = (formData.get('email')    as string).trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Email e senha são obrigatórios' }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Confirme seu email antes de entrar. Verifique sua caixa de entrada.' }
    }
    return { error: 'Email ou senha incorretos' }
  }
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
