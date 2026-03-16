import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"

import { env } from "@/config/env"
import { getSession } from "@/lib/auth/session"
import { redirect } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { CustomerRequestsList } from "@/features/customerRequests/components/CustomerRequestsList"

type Props = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "Setup" })
  const title = `${t("title")} – ${t("customerRequests.title")}`

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/setup/customer-requests`,
      languages: {
        en: `${env.NEXT_PUBLIC_SITE_URL}/en/setup/customer-requests`,
        cs: `${env.NEXT_PUBLIC_SITE_URL}/cs/setup/customer-requests`,
      },
    },
  } satisfies Metadata
}

const CustomerRequestsPage = async (props: Props) => {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "Setup" })

  const { session, user } = await getSession()

  if (!session?.isValid || !user) {
    redirect({ href: ROUTES.home, locale })
  }

  return (
    <div className="min-w-0 flex-1 overflow-x-hidden rounded-2xl bg-muted/50 p-4 sm:p-6 md:p-10">
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">{t("customerRequests.title")}</h1>
        <p className="text-muted-foreground">{t("customerRequests.description")}</p>
      </div>

      <CustomerRequestsList />
    </div>
  )
}

export default CustomerRequestsPage
