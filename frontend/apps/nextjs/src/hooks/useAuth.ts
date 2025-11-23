import type {
  LoginRequest,
  LoginResponse,
  RegistrationRequest,
  RegistrationResponse,
} from "@/api/userTypes"
import { publicApi } from "@/lib/api/restClient"
import { authClient } from "@/lib/auth/authClient"
import { useRouter } from "@/lib/i18n/navigation"
import { getQueryClient } from "@/lib/react-query/queryClient"
import { ROUTES } from "@/lib/routes"

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

      // The refresh token is set as a cookie by the backend automatically
      // The access token is in the response body
      // Store access token if needed (or use it from response)

      // Persist access token for SSR header (/me) via frontend cookie.
      // Respect the "remember me" flag by extending cookie lifetime when enabled.
      if (typeof document !== "undefined") {
        const maxAgeSeconds = shouldRememberMe ? 60 * 60 * 24 * 30 : 60 * 60
        document.cookie = `access_token=${encodeURIComponent(response.token)}; Path=/; Max-Age=${maxAgeSeconds}`
      }

      queryClient.clear()

      // Redirect to setup page (or callbackURL if provided)
      const redirectPath = callbackURL ?? ROUTES.setup
      router.push(redirectPath)
      router.refresh()

      return { error: null, data: response }
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Login failed",
        },
        data: null,
      }
    }
  }

  const signOut = async () => {
    await authClient.signOut()
    if (typeof document !== "undefined") {
      document.cookie = "access_token=; Path=/; Max-Age=0"
    }
    router.refresh()
    queryClient.clear()
  }

  const signUp = async (
    email: string,
    password: string,
    name: string,
    callbackURL: string = ROUTES.home,
  ) => {
    try {
      // Split name into firstName and surname (use name as firstName if no space)
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
      return {
        error: {
          message: error instanceof Error ? error.message : "Registration failed",
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
