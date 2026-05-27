import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabase/server'

export async function validateAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin_session')?.value

  if (!sessionToken) return false

  const { data, error } = await supabaseAdmin
    .from('admin_sessions')
    .select('expires_at')
    .eq('token', sessionToken)
    .single()

  if (error || !data) return false

  return new Date(data.expires_at) > new Date()
}
