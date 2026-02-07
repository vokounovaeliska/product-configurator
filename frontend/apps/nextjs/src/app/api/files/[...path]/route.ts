import { NextResponse, type NextRequest } from "next/server"

const FETCH_TIMEOUT_MS = 10_000

/**
 * Proxies file requests to the backend so the option image editor can load
 * images same-origin and avoid CORS / tainted canvas issues.
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await context.params
  const filename = pathSegments?.join("/")
  if (!filename) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_REST_API_URL?.replace(/\/$/, "") ?? ""
  if (!baseUrl) {
    return NextResponse.json({ error: "NEXT_PUBLIC_REST_API_URL not configured" }, { status: 503 })
  }

  const backendUrl = `${baseUrl}/api/v1/files/${filename}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(backendUrl, {
      next: { revalidate: 300 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) {
      return new NextResponse(null, { status: res.status })
    }
    const contentType = res.headers.get("content-type") ?? "application/octet-stream"
    const body = await res.arrayBuffer()
    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "private, max-age=3600",
      },
    })
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError"
    console.error("File proxy error:", isAbort ? "timeout" : err)
    return NextResponse.json(
      { error: isAbort ? "Backend timeout" : "Proxy failed" },
      { status: 502 },
    )
  }
}
