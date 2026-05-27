import { notFound } from 'next/navigation'
import CameraUploader from '@/components/CameraUploader'
import { supabaseAdmin } from '@/lib/supabase/server'

export default async function UploadPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const { data, error } = await supabaseAdmin
    .from('upload_sessions')
    .select('folder_name, expires_at, is_used')
    .eq('token', token)
    .single()

  if (error || !data) {
    return <ErrorScreen message="無効なリンクです" />
  }

  if (data.is_used) {
    return <ErrorScreen message="このリンクはすでに使用済みです" />
  }

  if (new Date(data.expires_at) <= new Date()) {
    return <ErrorScreen message="このリンクは有効期限切れです" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CameraUploader token={token} folderName={data.folder_name} />
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">リンクが無効です</h1>
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  )
}
