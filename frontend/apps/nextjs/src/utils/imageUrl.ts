import { env } from "@/config/env"

/**
 * Resolves a stored image URL (relative or absolute) to a full URL for display/loading.
 * Backend returns relative paths like "/api/v1/files/{filename}"; we prepend the API base
 * so images load correctly.
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  const base = env.NEXT_PUBLIC_REST_API_URL.replace(/\/$/, "")
  const path = url.startsWith("/") ? url : `/${url}`
  return `${base}${path}`
}

/**
 * Returns a same-origin URL for loading an image in the option image editor (canvas).
 * Proxies through Next.js /api/files/* so the image loads same-origin and avoids
 * CORS / tainted canvas when reading pixel data.
 */
export function getEditorImageUrl(url: string | null | undefined): string {
  if (!url) return ""
  const trimmed = url.trim()
  if (!trimmed) return ""
  // Extract filename: "/api/v1/files/xxx" or "http://backend/api/v1/files/xxx"
  const match = /\/api\/v1\/files\/(.+)$/i.exec(trimmed)
  if (match?.[1]) {
    return `/api/files/${match[1]}`
  }
  // Fallback to full URL (may still hit CORS in editor)
  return getImageUrl(trimmed)
}
