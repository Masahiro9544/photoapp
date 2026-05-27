import { v4 as uuidv4 } from 'uuid'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'heif']
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const MAX_FILES_PER_REQUEST = 10

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `サポートされていないファイル形式です: ${file.type}` }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `サポートされていない拡張子です: ${ext}` }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `ファイルサイズが上限(20MB)を超えています` }
  }

  return { valid: true }
}

export function validateFileCount(count: number): { valid: boolean; error?: string } {
  if (count > MAX_FILES_PER_REQUEST) {
    return { valid: false, error: `一度にアップロードできるのは${MAX_FILES_PER_REQUEST}枚までです` }
  }
  return { valid: true }
}

export function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() ?? 'jpg'
  const timestamp = Date.now()
  const uuid = uuidv4()
  return `${timestamp}_${uuid}.${ext}`
}
