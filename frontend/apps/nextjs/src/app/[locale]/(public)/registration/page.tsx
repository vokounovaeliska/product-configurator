import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Typography } from "@workspace/ui/components/typography"

import { env } from "@/config/env"

import { RegistrationForm } from "@/features/auth/components/RegistrationForm"

type Props = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "Registration" })
  const title = t("title")

  // TODO: Extend as needed
  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/registration`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/registration`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/registration`,
      },
    },
  } satisfies Metadata
}

const RegistrationPage = async (props: Props) => {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "Registration" })

  return (
    <div className="flex flex-1 flex-col items-center rounded-2xl bg-muted/50 p-6 sm:p-10">
      <div className="flex w-full max-w-lg flex-col gap-6 sm:gap-8">
        <Typography
          as="h1"
          variant="display-3xl"
          weight="bold"
          className="text-center"
        >
          {t("title")}
        </Typography>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
          <RegistrationForm />
        </div>
      </div>
    </div>
  )
}

export default RegistrationPage
