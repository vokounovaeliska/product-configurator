import type {
  LoginRequest,
  LoginResponse,
  RegistrationRequest,
  RegistrationResponse,
} from "@/api/userTypes"
import { publicApi } from "@/lib/api/restClient"
import { useRouter } from "@/lib/i18n/navigation"
import { getQueryClient } from "@/lib/react-query/queryClient"
import { ROUTES } from "@/lib/routes"
import { extractErrorMessage } from "@/lib/utils"

export const useAuth = () => {
  const router = useRouter()
  const queryClient = getQueryClient()

  const signIn = async (
    email: string,
    password: string,
    shouldRememberMe = false,
    callbackURL?: string,
  ) => {
    try {
      const body: LoginRequest = {
        email,
        password,
      }

      const response = await publicApi
        .post("users/api/v1/auth/public/login", {
          json: body,
        })
        .json<LoginResponse>()

      if (typeof document !== "undefined") {
        const maxAgeSeconds = shouldRememberMe ? 60 * 60 * 24 * 30 : 60 * 60
        document.cookie = `access_token=${encodeURIComponent(response.token)}; Path=/; Max-Age=${maxAgeSeconds}`
      }

      queryClient.clear()

      const redirectPath = callbackURL ?? ROUTES.setup
      router.push(redirectPath)
      router.refresh()

      return { error: null, data: response }
    } catch (error) {
      const message = await extractErrorMessage(error)
      return {
        error: { message },
        data: null,
      }
    }
  }

  const signOut = async () => {
    try {
      await publicApi.post("users/api/v1/auth/logout", {
        credentials: "include", // Include cookies for refresh token
      })
    } catch (error) {
      console.warn("Logout API call failed, continuing with local logout:", error)
    }

    if (typeof document !== "undefined") {
      document.cookie = "access_token=; Path=/; Max-Age=0"
    }

    queryClient.clear()
    router.push(ROUTES.home)
    router.refresh()
  }

  const signUp = async (
    email: string,
    password: string,
    name: string,
    callbackURL: string = ROUTES.home,
  ) => {
    try {
      const nameParts = name.trim().split(/\s+/)
      const firstName = nameParts[0] ?? ""
      const surname = nameParts.slice(1).join(" ") || firstName

      const body: RegistrationRequest = {
        firstName,
        surname,
        email,
        password,
        confirmPassword: password,
      }

      await publicApi
        .post("users/api/v1/auth/public/register", {
          json: body,
        })
        .json<RegistrationResponse>()

      queryClient.clear()

      const redirectPath = callbackURL ?? ROUTES.setup
      router.push(redirectPath)
      router.refresh()

      return { error: null }
    } catch (error) {
      const message = await extractErrorMessage(error)
      return {
        error: {
          message,
        },
      }
    }
  }

  return {
    signIn,
    signOut,
    signUp,
  }
}
