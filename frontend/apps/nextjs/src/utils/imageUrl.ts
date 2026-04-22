import { env } from "@/config/env"

export function getImageUrl(url: string | null | undefined): string {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  const base = env.NEXT_PUBLIC_REST_API_URL.replace(/\/$/, "")
  const path = url.startsWith("/") ? url : `/${url}`
  return `${base}${path}`
}

export function getImageUrlForDisplay(url: string | null | undefined): string {
  if (!url) return ""
  const trimmed = url.trim()
  if (!trimmed) return ""
  const match = /\/api\/v1\/files\/(.+)$/i.exec(trimmed)
  if (match?.[1]) {
    return `/api/files/${match[1]}`
  }
  return getImageUrl(trimmed)
}

export function getEditorImageUrl(url: string | null | undefined): string {
  if (!url) return ""
  const trimmed = url.trim()
  if (!trimmed) return ""
  const match = /\/api\/v1\/files\/(.+)$/i.exec(trimmed)
  if (match?.[1]) {
    return `/api/files/${match[1]}`
  }
  return getImageUrl(trimmed)
}
