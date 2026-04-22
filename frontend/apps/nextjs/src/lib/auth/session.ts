import type { UserDto } from "@/api/userTypes"
import { publicApi } from "@/lib/api/restClient"
import { getCookie } from "@/utils/cookies"

type SessionType = {
  user: { id: string; email: string; name?: string } | null
  session: { isValid: boolean } | null
}

export const getSession = async (): Promise<SessionType> => {
  try {
    const accessTokenCookie = await getCookie("access_token")

    if (!accessTokenCookie?.value) {
      return { user: null, session: null }
    }

    const accessToken = accessTokenCookie.value

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
