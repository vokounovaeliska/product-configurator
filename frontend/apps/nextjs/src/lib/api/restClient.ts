import ky, { HTTPError, type KyInstance } from "ky"

import { env } from "@/config/env"

import { getAccessToken, getAccessTokenClient, setAccessTokenClient } from "../auth/authCookies"

const REST_API_BASE = env.NEXT_PUBLIC_REST_API_URL.replace(/\/$/, "")

function normalizeInput(input: string | URL | Request): string | URL | Request {
  if (typeof input !== "string") return input
  const trimmed = input.trim()
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.startsWith(REST_API_BASE)) {
      const path = trimmed.slice(REST_API_BASE.length).replace(/^\//, "")
      return path || "."
    }
    return new URL(trimmed)
  }
  return input
}

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

const DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60

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
        if (response.status === 401 && !request.url.includes("/auth/refresh")) {
          const newAccessToken = await refreshAccessToken()

          if (newAccessToken) {
            const retryRequest = request.clone()
            retryRequest.headers.set("Authorization", `Bearer ${newAccessToken}`)

            const opts = options as unknown as Record<string, unknown>
            const { prefixUrl: _prefixUrl, ...optionsWithoutPrefix } = opts
            const retryOptions = {
              ...optionsWithoutPrefix,
              headers: Object.fromEntries(retryRequest.headers.entries()),
              body: request.body,
            }

            return ky(new URL(request.url), { ...retryOptions, credentials: "include" })
          } else {
            setAccessTokenClient("", 0)
            throw new HTTPError(response, request, options)
          }
        }

        return response
      },
    ],
  },
})

export const publicApi = createApiClient({
  credentials: "include", // Include cookies in requests (needed for refresh token)
})

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
