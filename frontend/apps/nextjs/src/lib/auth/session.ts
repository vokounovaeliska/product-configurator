import type { Session, User } from "better-auth"

import { authClient } from "./authClient"
import { getAuthCookies } from "./authCookies"

type SessionType = {
  user: User | null
  session: Session | null
}

export const getSession = async (): Promise<SessionType> => {
  try {
    const authCookies = await getAuthCookies()

    const { data } = await authClient.getSession(
      {},
      {
        headers: {
          cookie: authCookies,
        },
      },
    )

    return { user: data?.user ?? null, session: data?.session ?? null }
  } catch (error) {
    // Handle fetch errors gracefully (backend not available, network issues, etc.)
    // Only log in development to avoid noise in production
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Failed to get session (backend may not be running):",
        error instanceof Error ? error.message : error,
      )
    }
    return { user: null, session: null }
  }
}
