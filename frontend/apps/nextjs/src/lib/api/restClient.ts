import ky from "ky"

import { env } from "@/config/env"

import { getAuthCookies } from "../auth/authCookies"

// Authenticated API client (with auth cookies)
export const api = ky.create({
  prefixUrl: env.NEXT_PUBLIC_REST_API_URL,
  hooks: {
    beforeRequest: [
      async (request) => {
        const authCookies = await getAuthCookies()

        request.headers.set("cookie", authCookies)
      },
    ],
  },
})

// Public API client (no auth, no prefix, but includes credentials for cookies)
export const publicApi = ky.create({
  prefixUrl: env.NEXT_PUBLIC_REST_API_URL,
  credentials: "include", // Include cookies in requests (needed for refresh token)
})
