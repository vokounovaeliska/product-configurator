import ky, { HTTPError } from "ky"

import { env } from "@/config/env"

import { getAccessTokenClient, setAccessTokenClient } from "../auth/authCookies"

// Track if we're currently refreshing to avoid multiple simultaneous refresh attempts
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

/**
 * Attempts to refresh the access token using the refresh token
 * Since the refresh token cookie has path="/users/api/v1/auth", we need to call
 * the backend refresh endpoint directly. The cookie will be sent automatically
 * with credentials: "include", but the backend expects it in Authorization header.
 *
 * Note: This won't work as-is because the refresh token is httpOnly and we can't
 * read it from JS. We need the backend to also accept refresh token from cookie.
 */
const refreshAccessToken = async (): Promise<string | null> => {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = Promise.resolve(null).finally(() => {
    isRefreshing = false
    refreshPromise = null
  })

  return refreshPromise
}

// Authenticated API client (with JWT Bearer token and automatic refresh)
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
    afterResponse: [
      async (request, options, response) => {
        // If we get a 401, try to refresh the token and retry the request
        if (response.status === 401 && !request.url.includes("/auth/refresh")) {
          const newAccessToken = await refreshAccessToken()

          if (newAccessToken) {
            // Retry the original request with the new token
            // Clone the request and update the Authorization header
            const retryRequest = request.clone()
            retryRequest.headers.set("Authorization", `Bearer ${newAccessToken}`)

            // Create a new request with the updated headers
            const retryOptions = {
              ...options,
              headers: Object.fromEntries(retryRequest.headers.entries()),
              body: request.body,
            }

            // Use ky with the same prefixUrl to retry
            return ky(request.url, retryOptions)
          } else {
            // Refresh failed - user needs to log in again
            // Clear the access token cookie
            setAccessTokenClient("", 0)
            throw new HTTPError(response, request, options)
          }
        }

        return response
      },
    ],
  },
})

// Public API client (no auth, no prefix, but includes credentials for cookies)
export const publicApi = ky.create({
  prefixUrl: env.NEXT_PUBLIC_REST_API_URL,
  credentials: "include", // Include cookies in requests (needed for refresh token)
})
