import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const isValid = await validateAdminSession()
    if (!isValid) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const path = request.nextUrl.searchParams.get('path')
    const folder = request.nextUrl.searchParams.get('folder')

    if (folder) {
      const { data: files, error } = await supabaseAdmin.storage
        .from('photos')
        .list(folder, { limit: 1000 })

      if (error || !files) {
        return NextResponse.json({ error: 'ファイル一覧の取得に失敗しました' }, { status: 500 })
      }

      const photoFiles = files.filter(f => f.id)
      const paths = photoFiles.map(f => `${folder}/${f.name}`)

      const { data: signedUrls, error: signError } = await supabaseAdmin.storage
        .from('photos')
        .createSignedUrls(paths, 300)

      if (signError) {
        return NextResponse.json({ error: '署名付きURL生成に失敗しました' }, { status: 500 })
      }

      return NextResponse.json({ files: signedUrls?.map((u, i) => ({ name: photoFiles[i].name, url: u.signedUrl })) })
    }

    if (path) {
      const { data, error } = await supabaseAdmin.storage
        .from('photos')
        .createSignedUrl(path, 300)

      if (error || !data) {
        return NextResponse.json({ error: '署名付きURL生成に失敗しました' }, { status: 500 })
      }

      return NextResponse.json({ url: data.signedUrl })
    }

    return NextResponse.json({ error: 'パスまたはフォルダを指定してください' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
