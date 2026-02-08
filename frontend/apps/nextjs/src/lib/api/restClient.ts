import ky, { HTTPError } from "ky"

import { env } from "@/config/env"

import { getAccessToken, getAccessTokenClient, setAccessTokenClient } from "../auth/authCookies"

// Track if we're currently refreshing to avoid multiple simultaneous refresh attempts
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

/** Default access token lifetime when not provided by backend (1 hour). */
const DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60

/**
 * Refreshes the access token using the refresh token cookie.
 * The refresh token is httpOnly with path="/users/api/v1/auth"; the browser
 * sends it when we call the backend refresh URL with credentials. The backend
 * accepts refresh token from cookie or Authorization header.
 */
const refreshAccessToken = async (): Promise<string | null> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const url = `${env.NEXT_PUBLIC_REST_API_URL}/users/api/v1/auth/refresh`
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      })

      if (!response.ok) {
        return null
      }

      const data = (await response.json()) as { token?: string }
      const newToken = data.token

      if (typeof newToken !== "string" || !newToken) {
        return null
      }

      setAccessTokenClient(newToken, DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS)
      return newToken
    } catch {
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/** Returns true if the JWT payload exp is within the next marginSeconds. */
function isAccessTokenExpiringSoon(token: string, marginSeconds = 120): boolean {
  try {
    const payload = token.split(".")[1]
    if (!payload) return true
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number
    }
    const exp = decoded.exp
    if (typeof exp !== "number") return true
    return exp * 1000 - Date.now() < marginSeconds * 1000
  } catch {
    return true
  }
}

// Authenticated API client (with JWT Bearer token and automatic refresh)
export const api = ky.create({
  prefixUrl: env.NEXT_PUBLIC_REST_API_URL,
  credentials: "include",
  hooks: {
    beforeRequest: [
      async (request) => {
        let accessToken = getAccessTokenClient()
        if (accessToken && isAccessTokenExpiringSoon(accessToken)) {
          const newToken = await refreshAccessToken()
          accessToken = newToken ?? accessToken
        }
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

            return ky(request.url, { ...retryOptions, credentials: "include" })
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

/**
 * Creates an authenticated API client for use in Server Components / server context.
 * Uses the access token from cookies (read via next/headers). Call this once per request.
 */
export async function getServerApi() {
  const token = await getAccessToken()
  return ky.create({
    prefixUrl: env.NEXT_PUBLIC_REST_API_URL,
    hooks: {
      beforeRequest: [
        (request) => {
          if (token) {
            request.headers.set("Authorization", `Bearer ${token}`)
          }
        },
      ],
    },
  })
}
