import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { passphrase } = await request.json()

    if (!passphrase || passphrase !== process.env.ADMIN_PASSPHRASE) {
      return NextResponse.json({ error: 'パスフレーズが正しくありません' }, { status: 401 })
    }

    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabaseAdmin.from('admin_sessions').insert({
      token,
      expires_at: expiresAt,
      is_used: false,
    })

    if (error) {
      console.error('Session creation error:', error)
      return NextResponse.json({ error: 'セッション作成に失敗しました' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${request.headers.get('host')}`
    const magicLink = `${baseUrl}/api/admin/auth/verify?token=${token}`

    return NextResponse.json({ magicLink })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
