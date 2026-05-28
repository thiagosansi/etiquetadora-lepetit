'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(_prevState: { error?: string } | undefined, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    const isInvalidCredentials =
      error.message.toLowerCase().includes('invalid') ||
      error.message.toLowerCase().includes('credentials') ||
      error.message.toLowerCase().includes('password')
    return {
      error: isInvalidCredentials
        ? 'Credenciais inválidas. Verifique email e senha.'
        : 'Erro ao fazer login. Tente novamente.',
    }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
