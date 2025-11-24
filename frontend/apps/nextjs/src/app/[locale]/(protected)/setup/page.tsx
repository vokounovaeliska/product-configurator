import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Button } from "@workspace/ui/components/button"
import { Typography } from "@workspace/ui/components/typography"

import { env } from "@/config/env"
import { getSession } from "@/lib/auth/session"
import { Link, redirect } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

type Props = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale } = await props.params
  const t = await getTranslations({
    locale,
    namespace: "Setup",
  })
  const title = t("title")

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/setup`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/setup`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/setup`,
      },
    },
  } satisfies Metadata
}

const SetupPage = async (props: Props) => {
  const { locale } = await props.params
  const t = await getTranslations({
    locale,
    namespace: "Setup",
  })

  const { session, user } = await getSession()

  if (!session?.isValid || !user) {
    redirect({ href: ROUTES.home, locale })
  }

  const rawName = user?.name ?? ""
  const firstName = rawName.split(" ")[0] ?? ""

  return (
    <div className="flex-1 rounded-2xl bg-muted/50 p-10">
      <div className="mb-8">
        <Typography
          as="h1"
          variant="display-3xl"
          weight="bold"
          className="mb-2"
        >
          {t("welcome", { name: firstName })}
        </Typography>
        <Typography
          as="p"
          variant="body-lg"
          className="text-muted-foreground"
        >
          {t("description")}
        </Typography>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href={ROUTES.setupProductModels}>
          <div className="group rounded-lg border bg-card p-6 transition-colors hover:bg-accent">
            <Typography
              as="h2"
              variant="display-lg"
              weight="semibold"
              className="mb-2"
            >
              {t("productModels.title")}
            </Typography>
            <Typography
              as="p"
              variant="body-sm"
              className="mb-4 text-muted-foreground"
            >
              {t("productModels.description")}
            </Typography>
            <Button variant="outline">{t("productModels.action")}</Button>
          </div>
        </Link>

        {/* More setup cards can be added here in the future */}
      </div>
    </div>
  )
}

export default SetupPage
