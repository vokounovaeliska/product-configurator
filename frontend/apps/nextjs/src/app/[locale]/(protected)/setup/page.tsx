import {
  CalculatorIcon,
  DownloadIcon,
  FileUpIcon,
  GlobeIcon,
  InboxIcon,
  InfoIcon,
  PackageIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { env } from "@/config/env"
import { getSession } from "@/lib/auth/session"
import { Link, redirect } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { HowItWorksSection } from "@/features/setup/components/HowItWorksSection"

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

const STEP_ACCENT_CLASSES = [
  "bg-chart-1 text-white",
  "bg-chart-2 text-white",
  "bg-chart-3 text-white",
  "bg-chart-4 text-white",
] as const

const WORKFLOW_STEPS = [
  { titleKey: "guide.step1Title", descKey: "guide.step1Description", icon: PackageIcon },
  { titleKey: "guide.step2Title", descKey: "guide.step2Description", icon: SlidersHorizontalIcon },
  { titleKey: "guide.step3Title", descKey: "guide.step3Description", icon: CalculatorIcon },
  { titleKey: "guide.step4Title", descKey: "guide.step4Description", icon: GlobeIcon },
] as const

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
    <div className="flex-1 rounded-2xl bg-muted/50 p-6 md:p-10">
      {/* Welcome */}
      <div className="mb-10">
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

      {/* How it works */}
      <HowItWorksSection
        title={t("guide.howItWorks")}
        description={t("guide.howItWorksDescription")}
        showStepsLabel={t("guide.showSteps")}
        hideStepsLabel={t("guide.hideSteps")}
        className="mb-10"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((step, idx) => {
            const Icon = step.icon
            const accentClass = STEP_ACCENT_CLASSES[idx]
            return (
              <Card
                key={step.titleKey}
                className="group relative flex flex-col gap-3 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
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
              </Card>
            )
          })}
        </div>
      </HowItWorksSection>

      {/* Quick actions */}
      <section className="mb-10">
        <Typography
          as="h2"
          variant="display-lg"
          weight="semibold"
          className="mb-5"
        >
          {t("guide.quickActions")}
        </Typography>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link href={ROUTES.setupProductModels}>
            <div className="group flex h-full min-h-[200px] flex-col rounded-xl border bg-card p-7 transition-colors hover:bg-accent">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <PackageIcon className="size-6" />
                </span>
                <Typography
                  as="h3"
                  variant="body-md"
                  weight="semibold"
                >
                  {t("productModels.title")}
                </Typography>
              </div>
              <Typography
                as="p"
                variant="body-sm"
                className="mb-4 flex-1 text-muted-foreground"
              >
                {t("productModels.description")}
              </Typography>
              <Button
                variant="outline"
                className="w-fit"
              >
                {t("productModels.action")}
              </Button>
            </div>
          </Link>

          <Link href={ROUTES.setupImportSketchup}>
            <div className="group flex h-full min-h-[200px] flex-col rounded-xl border bg-card p-7 transition-colors hover:bg-accent">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileUpIcon className="size-6" />
                </span>
                <Typography
                  as="h3"
                  variant="body-md"
                  weight="semibold"
                >
                  {t("guide.importAction")}
                </Typography>
              </div>
              <Typography
                as="p"
                variant="body-sm"
                className="mb-4 flex-1 text-muted-foreground"
              >
                {t("guide.importDescription")}
              </Typography>
              <Button
                variant="outline"
                className="w-fit"
              >
                {t("guide.importAction")}
              </Button>
            </div>
          </Link>

          <Link href={ROUTES.setupCustomerRequests}>
            <div className="group flex h-full min-h-[200px] flex-col rounded-xl border bg-card p-7 transition-colors hover:bg-accent">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <InboxIcon className="size-6" />
                </span>
                <Typography
                  as="h3"
                  variant="body-md"
                  weight="semibold"
                >
                  {t("guide.requestsAction")}
                </Typography>
              </div>
              <Typography
                as="p"
                variant="body-sm"
                className="mb-4 flex-1 text-muted-foreground"
              >
                {t("guide.requestsDescription")}
              </Typography>
              <Button
                variant="outline"
                className="w-fit"
              >
                {t("guide.requestsAction")}
              </Button>
            </div>
          </Link>
        </div>
      </section>

      {/* Tip: 3D model */}
      <section>
        <Card className="flex gap-4 border-primary/20 bg-primary/5 p-5">
          <InfoIcon className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="flex-1">
            <Typography
              as="h3"
              variant="body-md"
              weight="semibold"
              className="mb-1"
            >
              {t("guide.tipTitle")}
            </Typography>
            <Typography
              as="p"
              variant="body-sm"
              className="mb-3 text-muted-foreground"
            >
              {t("guide.tipBody")}
            </Typography>
            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <a
                href="/downloads/configurator_dc_export.rbz"
                download="configurator_dc_export.rbz"
              >
                <DownloadIcon className="mr-2 size-4" />
                {t("guide.downloadPlugin")}
              </a>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default SetupPage
