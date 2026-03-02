import {
  CalculatorIcon,
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
      <section className="mb-10">
        <Typography
          as="h2"
          variant="display-lg"
          weight="semibold"
          className="mb-1"
        >
          {t("guide.howItWorks")}
        </Typography>
        <Typography
          as="p"
          variant="body-sm"
          className="mb-5 text-muted-foreground"
        >
          {t("guide.howItWorksDescription")}
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
              </Card>
            )
          })}
        </div>
      </section>

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
            <div className="group flex h-full flex-col rounded-lg border bg-card p-6 transition-colors hover:bg-accent">
              <div className="mb-3 flex items-center gap-2">
                <PackageIcon className="size-5 text-primary" />
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
            <div className="group flex h-full flex-col rounded-lg border bg-card p-6 transition-colors hover:bg-accent">
              <div className="mb-3 flex items-center gap-2">
                <FileUpIcon className="size-5 text-primary" />
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
            <div className="group flex h-full flex-col rounded-lg border bg-card p-6 transition-colors hover:bg-accent">
              <div className="mb-3 flex items-center gap-2">
                <InboxIcon className="size-5 text-primary" />
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
          <div>
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
              className="text-muted-foreground"
            >
              {t("guide.tipBody")}
            </Typography>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default SetupPage
