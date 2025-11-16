import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Typography } from "@workspace/ui/components/typography"

import { SignInForm } from "@/components/SignInForm"
import { env } from "@/config/env"
import { getSession } from "@/lib/auth/session"
import { redirect } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

type Props = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "Login" })
  const title = t("title")

  // TODO: Extend as needed
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

  const { session } = await getSession()

  if (session) {
    redirect({ href: ROUTES.home, locale })
  }

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

      <SignInForm />
    </div>
  )
}

export default LoginPage
