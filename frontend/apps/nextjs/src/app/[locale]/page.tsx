import {
  ArrowRightIcon,
  CalculatorIcon,
  DownloadIcon,
  GlobeIcon,
  LogInIcon,
  PackageIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { getSession } from "@/lib/auth/session"
import { Link, redirect } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { HowItWorksSection } from "@/features/setup/components/HowItWorksSection"

const STEP_ACCENT_CLASSES = [
  "bg-primary/15 text-primary",
  "bg-primary/12 text-primary",
  "bg-primary/10 text-primary",
  "bg-primary/8 text-primary",
] as const

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

  setRequestLocale(locale)

  const { session } = await getSession()
  const isLoggedIn = Boolean(session?.isValid ?? false)

  if (isLoggedIn) {
    redirect({ href: ROUTES.setupProductModels, locale })
  }

  const t = await getTranslations({ locale })

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl flex-col items-center gap-6 px-2 py-4 sm:gap-12 sm:px-4 sm:py-12">
      {/* Hero */}
      <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl lg:text-6xl">
          {t("HomePage.title")}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg sm:text-xl">
          {t("HomePage.description")}
        </p>
        <div className="flex w-full max-w-xs flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row sm:gap-4">
          <Button
            asChild
            size="lg"
            className="w-full gap-2 px-6 shadow-md transition-all hover:shadow-lg sm:w-auto"
          >
            <Link
              href={ROUTES.registration}
              prefetch={false}
            >
              {t("HomePage.primaryCta")}
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="w-full gap-2 text-muted-foreground hover:bg-muted/80 hover:text-foreground sm:w-auto"
          >
            <Link
              href={ROUTES.login}
              prefetch={false}
            >
              <LogInIcon className="size-4" />
              {t("HomePage.secondaryCta")}
            </Link>
          </Button>
        </div>
      </div>

      {/* How it works */}
      <div className="w-full px-2 sm:px-4">
        <HowItWorksSection
          title={t("Setup.guide.howItWorks")}
          description={t("Setup.guide.howItWorksDescription")}
          showStepsLabel={t("Setup.guide.showSteps")}
          hideStepsLabel={t("Setup.guide.hideSteps")}
          isCentered
          isCollapsible={false}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((step, idx) => {
              const Icon = step.icon
              const accentClass = STEP_ACCENT_CLASSES[idx]
              return (
                <Card
                  key={step.titleKey}
                  className="group relative flex min-w-0 flex-col gap-3 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm transition-transform group-hover:scale-110",
                        accentClass,
                      )}
                    >
                      {idx + 1}
                    </span>
                    <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
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
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-2 w-fit"
                    >
                      <a
                        href="/downloads/konfiguruj_export.rbz"
                        download="konfiguruj_export.rbz"
                        className="inline-flex items-center gap-2"
                      >
                        <DownloadIcon className="size-4" />
                        {t("Setup.guide.downloadPluginShort")}
                      </a>
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        </HowItWorksSection>
      </div>
    </div>
  )
}
