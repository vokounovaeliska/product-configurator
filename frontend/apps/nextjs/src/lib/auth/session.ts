import type { UserDto } from "@/api/userTypes"
import { publicApi } from "@/lib/api/restClient"
import { getCookie } from "@/utils/cookies"

type SessionType = {
  user: { id: string; email: string; name?: string } | null
  session: { isValid: boolean } | null
}

export const getSession = async (): Promise<SessionType> => {
  try {
    // Access token is stored as a frontend cookie after login (see useAuth.signIn)
    const accessTokenCookie = await getCookie("access_token")

    if (!accessTokenCookie?.value) {
      return { user: null, session: null }
    }

    const accessToken = accessTokenCookie.value

    // Use the access token to fetch current user info from /users/me
    const me = await publicApi
      .get("users/api/v1/users/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .json<UserDto>()

    return {
      user: {
        id: me.id,
        email: me.email,
        name: `${me.firstName} ${me.surname}`.trim(),
      },
      session: { isValid: true },
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Failed to get session (backend may not be running or token invalid):",
        error instanceof Error ? error.message : error,
      )
    }
    return { user: null, session: null }
  }
}
