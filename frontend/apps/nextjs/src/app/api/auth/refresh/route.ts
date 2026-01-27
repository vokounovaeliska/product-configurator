import { NextResponse } from "next/server"

/**
 * Server-side API route to refresh access token
 *
 * NOTE: This route currently won't work because:
 * 1. The refresh token cookie has path="/users/api/v1/auth"
 * 2. So the browser won't send it to /api/auth/refresh
 * 3. The backend expects refresh token in Authorization header, not cookie
 *
 * TODO: Update backend refresh endpoint to also accept refresh token from cookie
 * (like the logout handler does), then this route can proxy the request.
 */
export function GET() {
  // Since the cookie path is restricted, we can't access it here.
  // For now, return an error indicating the backend needs to be updated.
  return NextResponse.json(
    {
      error:
        "Refresh token refresh not yet implemented. Backend needs to accept refresh token from cookie.",
    },
    { status: 501 },
  )
}
