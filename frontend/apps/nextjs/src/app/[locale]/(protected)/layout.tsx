import type { Locale } from "next-intl"

import { getSession } from "@/lib/auth/session"
import { redirect } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: Locale }>
}

export default async function ProtectedLayout({ children, params }: Props) {
  const { locale } = await params
  const { session } = await getSession()

  if (!session?.isValid) {
    redirect({ href: ROUTES.login, locale })
  }

  return <>{children}</>
}
