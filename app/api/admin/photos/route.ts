import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth'

export async function GET() {
  try {
    const isValid = await validateAdminSession()
    if (!isValid) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { data: folders, error: foldersError } = await supabaseAdmin.storage
      .from('photos')
      .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } })

    if (foldersError) {
      console.error('List folders error:', foldersError)
      return NextResponse.json({ error: 'フォルダ一覧の取得に失敗しました' }, { status: 500 })
    }

    const result: Record<string, { name: string; path: string; signedUrl: string }[]> = {}

    for (const folder of folders ?? []) {
      if (!folder.id) continue

      const { data: files, error: filesError } = await supabaseAdmin.storage
        .from('photos')
        .list(folder.name, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } })

      if (filesError || !files) continue

      const photoFiles = files.filter(f => f.id)
      if (photoFiles.length === 0) continue

      const paths = photoFiles.map(f => `${folder.name}/${f.name}`)
      const { data: signedUrls } = await supabaseAdmin.storage
        .from('photos')
        .createSignedUrls(paths, 3600)

      result[folder.name] = photoFiles.map((f, i) => ({
        name: f.name,
        path: `${folder.name}/${f.name}`,
        signedUrl: signedUrls?.[i]?.signedUrl ?? '',
      }))
    }

    return NextResponse.json({ folders: result })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
