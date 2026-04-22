import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json(
    {
      error:
        "Refresh token refresh not yet implemented. Backend needs to accept refresh token from cookie.",
    },
    { status: 501 },
  )
}
