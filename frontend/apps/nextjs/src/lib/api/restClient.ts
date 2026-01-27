import ky from "ky"

import { env } from "@/config/env"

import { getAccessTokenClient } from "../auth/authCookies"

// Authenticated API client (with JWT Bearer token)
export const api = ky.create({
  prefixUrl: env.NEXT_PUBLIC_REST_API_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const accessToken = getAccessTokenClient()

        if (accessToken) {
          request.headers.set("Authorization", `Bearer ${accessToken}`)
        }
      },
    ],
  },
})

// Public API client (no auth, no prefix, but includes credentials for cookies)
export const publicApi = ky.create({
  prefixUrl: env.NEXT_PUBLIC_REST_API_URL,
  credentials: "include", // Include cookies in requests (needed for refresh token)
})
