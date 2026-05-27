import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const { data, error } = await supabaseAdmin
      .from('upload_sessions')
      .select('folder_name, expires_at, is_used')
      .eq('token', token)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '無効なリンクです' }, { status: 404 })
    }

    if (data.is_used) {
      return NextResponse.json({ error: 'このリンクはすでに使用済みです' }, { status: 410 })
    }

    if (new Date(data.expires_at) <= new Date()) {
      return NextResponse.json({ error: 'このリンクは有効期限切れです' }, { status: 410 })
    }

    return NextResponse.json({ folderName: data.folder_name })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
