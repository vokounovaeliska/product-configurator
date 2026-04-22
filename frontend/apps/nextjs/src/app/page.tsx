import { DEFAULT_LOCALE } from "@/lib/i18n/config"
import { redirect } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

export default function RootPage() {
  redirect({ href: ROUTES.home, locale: DEFAULT_LOCALE })
}
