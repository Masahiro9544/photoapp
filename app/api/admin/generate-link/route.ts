import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const isValid = await validateAdminSession()
    if (!isValid) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { folderName } = await request.json()

    if (!folderName || typeof folderName !== 'string' || folderName.trim() === '') {
      return NextResponse.json({ error: 'フォルダ名を入力してください' }, { status: 400 })
    }

    const sanitizedFolderName = folderName.trim().replace(/[^a-zA-Z0-9_\-　-鿿゠-ヿ぀-ゟ]/g, '_')

    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabaseAdmin.from('upload_sessions').insert({
      folder_name: sanitizedFolderName,
      token,
      expires_at: expiresAt,
      is_used: false,
    })

    if (error) {
      console.error('Upload session creation error:', error)
      return NextResponse.json({ error: 'リンク生成に失敗しました' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${request.headers.get('host')}`
    const uploadUrl = `${baseUrl}/upload/${token}`

    return NextResponse.json({ uploadUrl, folderName: sanitizedFolderName })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
