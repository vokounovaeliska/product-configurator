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
  ) =>
    await authClient.signIn.email({
      email,
      password,
      rememberMe: shouldRememberMe,
      callbackURL,
    })

  const signOut = async () => {
    await authClient.signOut()
    router.refresh()
    queryClient.clear()
  }

  const signUp = async (
    email: string,
    password: string,
    name: string,
    callbackURL: string = ROUTES.home,
  ) =>
    await authClient.signUp.email(
      {
        email,
        password,
        name,
        // URL to redirect after the user verifies their email
        callbackURL,
      },
      {
        onSuccess: () => {
          router.refresh()
          queryClient.clear()
        },
      },
    )

  return {
    signIn,
    signOut,
    signUp,
  }
}
