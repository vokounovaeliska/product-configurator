import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Button } from "@workspace/ui/components/button"

import { Link } from "@/lib/i18n/navigation"

type Props = {
  params: Promise<{ locale: Locale }>
}

export default async function Page({ params }: Props) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: "HomePage" })

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{t("title")}</h1>
        <p className="text-lg text-muted-foreground sm:text-xl">{t("description")}</p>
      </div>
      <div className="flex gap-4">
        <Button asChild>
          <Link href={`/${locale}/login`}>{t("loginButton")}</Link>
        </Button>
        <Button
          asChild
          variant="outline"
        >
          <Link href={`/${locale}/registration`}>{t("registerButton")}</Link>
        </Button>
      </div>
    </div>
  )
}
