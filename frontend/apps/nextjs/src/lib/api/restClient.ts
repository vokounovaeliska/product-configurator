import ky, { HTTPError, type KyInstance } from "ky"

import { env } from "@/config/env"

import { getAccessToken, getAccessTokenClient, setAccessTokenClient } from "../auth/authCookies"

const REST_API_BASE = env.NEXT_PUBLIC_REST_API_URL.replace(/\/$/, "")

/**
 * Normalizes input for ky to avoid doubled URLs. ky's prefixUrl is applied to ALL string input,
 * including absolute URLs, which causes https://api.example.com/https://api.example.com/path.
 * - When input is already an absolute URL for our API, strip the base and pass the path so ky
 *   prepends prefixUrl once. This handles cases where ky may still apply prefixUrl to URL objects.
 * - Otherwise pass through.
 */
function normalizeInput(input: string | URL | Request): string | URL | Request {
  if (typeof input !== "string") return input
  const trimmed = input.trim()
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    // If it's our API base, strip it and return the relative path so ky adds prefixUrl once
    if (trimmed.startsWith(REST_API_BASE)) {
      const path = trimmed.slice(REST_API_BASE.length).replace(/^\//, "")
      return path || "."
    }
    // External URL: pass as URL so ky bypasses prefixUrl
    return new URL(trimmed)
  }
  return input
}

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

/** Creates a ky instance with input normalization to prevent doubled URLs. */
function createApiClient(baseOptions: Parameters<typeof ky.create>[0]): KyInstance {
  const base = ky.create({ ...baseOptions, prefixUrl: REST_API_BASE })
  return {
    get: (input, options) => base.get(normalizeInput(input), options),
    post: (input, options) => base.post(normalizeInput(input), options),
    put: (input, options) => base.put(normalizeInput(input), options),
    patch: (input, options) => base.patch(normalizeInput(input), options),
    delete: (input, options) => base.delete(normalizeInput(input), options),
    head: (input, options) => base.head(normalizeInput(input), options),
    extend: base.extend.bind(base),
  } as KyInstance
}

// Authenticated API client (with JWT Bearer token and automatic refresh)
export const api = createApiClient({
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

            // Create a new request with the updated headers.
            // Omit prefixUrl to avoid doubled URLs when retrying (ky would prepend prefixUrl again).
            const opts = options as unknown as Record<string, unknown>
            const { prefixUrl: _prefixUrl, ...optionsWithoutPrefix } = opts
            const retryOptions = {
              ...optionsWithoutPrefix,
              headers: Object.fromEntries(retryRequest.headers.entries()),
              body: request.body,
            }

            return ky(new URL(request.url), { ...retryOptions, credentials: "include" })
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

// Public API client (no auth, includes credentials for cookies)
export const publicApi = createApiClient({
  credentials: "include", // Include cookies in requests (needed for refresh token)
})

/**
 * Creates an authenticated API client for use in Server Components / server context.
 * Uses the access token from cookies (read via next/headers). Call this once per request.
 */
export async function getServerApi() {
  const token = await getAccessToken()
  return createApiClient({
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
