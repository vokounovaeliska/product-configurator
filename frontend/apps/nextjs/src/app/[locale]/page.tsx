import {
  CalculatorIcon,
  DownloadIcon,
  GlobeIcon,
  PackageIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"

import { getSession } from "@/lib/auth/session"
import { Link, redirect } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

const WORKFLOW_STEPS = [
  {
    titleKey: "Setup.guide.step1Title",
    descKey: "Setup.guide.step1Description",
    icon: PackageIcon,
  },
  {
    titleKey: "Setup.guide.step2Title",
    descKey: "Setup.guide.step2Description",
    icon: SlidersHorizontalIcon,
  },
  {
    titleKey: "Setup.guide.step3Title",
    descKey: "Setup.guide.step3Description",
    icon: CalculatorIcon,
  },
  { titleKey: "Setup.guide.step4Title", descKey: "Setup.guide.step4Description", icon: GlobeIcon },
] as const

type Props = {
  params: Promise<{ locale: Locale }>
}

export default async function Page({ params }: Props) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  const { session } = await getSession()
  const isLoggedIn = Boolean(session?.isValid ?? false)

  if (isLoggedIn) {
    redirect({ href: ROUTES.setupProductModels, locale })
  }

  const t = await getTranslations({ locale })

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center gap-12 py-12">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{t("HomePage.title")}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          {t("HomePage.description")}
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link
              href={ROUTES.login}
              prefetch={false}
            >
              {t("HomePage.loginButton")}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
          >
            <Link
              href={ROUTES.registration}
              prefetch={false}
            >
              {t("HomePage.registerButton")}
            </Link>
          </Button>
        </div>
      </div>

      {/* How it works */}
      <section className="w-full max-w-5xl px-4">
        <Typography
          as="h2"
          variant="display-lg"
          weight="semibold"
          className="mb-1 text-center"
        >
          {t("Setup.guide.howItWorks")}
        </Typography>
        <Typography
          as="p"
          variant="body-sm"
          className="mb-6 text-center text-muted-foreground"
        >
          {t("Setup.guide.howItWorksDescription")}
        </Typography>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((step, idx) => {
            const Icon = step.icon
            return (
              <Card
                key={step.titleKey}
                className="relative flex flex-col gap-3 p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {idx + 1}
                  </span>
                  <Icon className="size-5 text-muted-foreground" />
                </div>
                <Typography
                  as="h3"
                  variant="body-md"
                  weight="semibold"
                >
                  {t(step.titleKey)}
                </Typography>
                <Typography
                  as="p"
                  variant="body-sm"
                  className="text-muted-foreground"
                >
                  {t(step.descKey)}
                </Typography>
                {idx === 0 && (
                  <a
                    href="/downloads/configurator_dc_export.rbz"
                    download="configurator_dc_export.rbz"
                    className="mt-1 inline-flex items-center text-sm text-primary hover:underline"
                  >
                    <DownloadIcon className="mr-1 size-3.5" />
                    {t("Setup.guide.downloadPlugin")}
                  </a>
                )}
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
