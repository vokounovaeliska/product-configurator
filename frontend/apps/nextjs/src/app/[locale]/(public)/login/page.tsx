import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Typography } from "@workspace/ui/components/typography"

import { env } from "@/config/env"

import { SignInForm } from "@/features/auth/components/SignInForm"

type Props = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "Login" })
  const title = t("title")

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/login`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/login`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/login`,
      },
    },
  } satisfies Metadata
}

const LoginPage = async (props: Props) => {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "Login" })

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
          <SignInForm />
        </div>
      </div>
    </div>
  )
}

export default LoginPage
