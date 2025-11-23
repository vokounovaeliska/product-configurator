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
    <div className="flex-1 rounded-2xl bg-muted/50 p-10">
      <Typography
        as="h1"
        variant="display-3xl"
        weight="bold"
        className="text-center"
      >
        {t("title")}
      </Typography>

      <RegistrationForm />
    </div>
  )
}

export default RegistrationPage
