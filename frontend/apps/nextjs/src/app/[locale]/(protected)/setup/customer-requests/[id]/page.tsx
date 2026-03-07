import type { Metadata } from "next"
import { type Locale } from "next-intl"
import { getTranslations } from "next-intl/server"

import { env } from "@/config/env"
import { getSession } from "@/lib/auth/session"
import { redirect } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { CustomerRequestDetail } from "@/features/customerRequests/components/CustomerRequestDetail"

type Props = {
  params: Promise<{ locale: Locale; id: string }>
}

export async function generateMetadata(props: Omit<Props, "children">) {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "Setup" })
  const title = `${t("title")} – ${t("customerRequests.detail.title")}`

  return {
    title,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_SITE_URL}/setup/customer-requests`,
    },
  } satisfies Metadata
}

const CustomerRequestDetailPage = async (props: Props) => {
  const { locale, id } = await props.params
  const { session, user } = await getSession()

  if (!session?.isValid || !user) {
    redirect({ href: ROUTES.home, locale })
  }

  return <CustomerRequestDetail id={id} />
}

export default CustomerRequestDetailPage
