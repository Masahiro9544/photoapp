import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { validateFile, validateFileCount, generateFileName } from '@/lib/upload'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const token = formData.get('token') as string

    if (!token) {
      return NextResponse.json({ error: 'トークンが必要です' }, { status: 400 })
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('upload_sessions')
      .select('folder_name, expires_at, is_used')
      .eq('token', token)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: '無効なリンクです' }, { status: 404 })
    }

    if (session.is_used) {
      return NextResponse.json({ error: 'このリンクはすでに使用済みです' }, { status: 410 })
    }

    if (new Date(session.expires_at) <= new Date()) {
      return NextResponse.json({ error: 'このリンクは有効期限切れです' }, { status: 410 })
    }

    const files = formData.getAll('photos') as File[]

    const countValidation = validateFileCount(files.length)
    if (!countValidation.valid) {
      return NextResponse.json({ error: countValidation.error }, { status: 400 })
    }

    if (files.length === 0) {
      return NextResponse.json({ error: '写真を選択してください' }, { status: 400 })
    }

    const uploadResults: string[] = []
    const errors: string[] = []

    for (const file of files) {
      const validation = validateFile(file)
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`)
        continue
      }

      const fileName = generateFileName(file.name)
      const filePath = `${session.folder_name}/${fileName}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await supabaseAdmin.storage
        .from('photos')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        errors.push(`${file.name}: アップロードに失敗しました`)
      } else {
        uploadResults.push(filePath)
      }
    }

    if (uploadResults.length > 0) {
      await supabaseAdmin
        .from('upload_sessions')
        .update({ is_used: true })
        .eq('token', token)
    }

    if (errors.length > 0 && uploadResults.length === 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
    }

    return NextResponse.json({
      uploaded: uploadResults.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
