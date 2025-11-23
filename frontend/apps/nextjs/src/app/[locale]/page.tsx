import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Button } from "@workspace/ui/components/button"

import { getSession } from "@/lib/auth/session"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

type Props = {
  params: Promise<{ locale: Locale }>
}

export default async function Page({ params }: Props) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  const t = await getTranslations({ locale })
  const { session } = await getSession()
  const isLoggedIn = Boolean(session?.isValid ?? false)

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{t("HomePage.title")}</h1>
        <p className="text-lg text-muted-foreground sm:text-xl">{t("HomePage.description")}</p>
      </div>

      {isLoggedIn && (
        <div className="flex gap-4">
          <Button asChild>
            <Link href={ROUTES.setup}>{t("HomePage.setupCta")}</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
