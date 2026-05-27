import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid', request.url))
    }

    const { data, error } = await supabaseAdmin
      .from('admin_sessions')
      .select('expires_at, is_used')
      .eq('token', token)
      .single()

    if (error || !data) {
      return NextResponse.redirect(new URL('/login?error=invalid', request.url))
    }

    if (data.is_used) {
      return NextResponse.redirect(new URL('/login?error=used', request.url))
    }

    if (new Date(data.expires_at) <= new Date()) {
      return NextResponse.redirect(new URL('/login?error=expired', request.url))
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${request.headers.get('host')}`
    const response = NextResponse.redirect(new URL('/admin', baseUrl))

    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.redirect(new URL('/login?error=server', request.url))
  }
}
