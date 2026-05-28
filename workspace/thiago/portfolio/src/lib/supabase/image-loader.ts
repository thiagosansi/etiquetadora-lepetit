export default function supabaseImageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
  if (!projectId || src.startsWith('http') || src.startsWith('/')) {
    return src
  }
  return `https://${projectId}.supabase.co/storage/v1/render/image/public/${src}?width=${width}&quality=${quality ?? 75}`
}

export function getSupabaseImageUrl(
  path: string,
  opts: { width?: number; quality?: number } = {}
) {
  const { width = 1200, quality = 75 } = opts
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
  if (!projectId || !path) return ''
  return `https://${projectId}.supabase.co/storage/v1/render/image/public/${path}?width=${width}&quality=${quality}`
}
