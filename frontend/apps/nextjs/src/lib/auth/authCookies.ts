import { getCookie } from "@/utils/cookies"

export const getAuthCookies = async () => {
  const sessionToken = (await getCookie("better-auth.session_token"))?.value ?? ""
  const dontRemember = (await getCookie("better-auth.dont_remember"))?.value ?? ""

  const cookieHeader = [
    `better-auth.session_token=${sessionToken}`,
    `better-auth.dont_remember=${dontRemember}`,
  ].join(";")

  return cookieHeader
}

/**
 * Gets the access token from cookies for JWT authentication (server-side)
 */
export const getAccessToken = async (): Promise<string | null> => {
  const accessTokenCookie = await getCookie("access_token")
  return accessTokenCookie?.value ?? null
}

/**
 * Gets the access token from cookies for JWT authentication (client-side)
 */
export const getAccessTokenClient = (): string | null => {
  if (typeof document === "undefined") {
    return null
  }

  const cookies = document.cookie.split(";")
  const accessTokenCookie = cookies.find((cookie) => cookie.trim().startsWith("access_token="))

  if (!accessTokenCookie) {
    return null
  }

  const value = accessTokenCookie.split("=")[1]
  return value ? decodeURIComponent(value) : null
}

/**
 * Note: The refresh token is stored in an httpOnly cookie by the backend,
 * so it cannot be accessed from client-side JavaScript.
 * Use the server-side API route /api/auth/refresh to refresh tokens.
 */

/**
 * Sets the access token in a cookie (client-side)
 */
export const setAccessTokenClient = (token: string, maxAgeSeconds?: number): void => {
  if (typeof document === "undefined") {
    return
  }

  const maxAge = maxAgeSeconds ? `; Max-Age=${maxAgeSeconds}` : ""
  document.cookie = `access_token=${encodeURIComponent(token)}; Path=/${maxAge}`
}
