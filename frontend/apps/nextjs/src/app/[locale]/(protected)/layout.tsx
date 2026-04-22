import { hasLocale } from "next-intl"

import { ConfiguratorQueryProvider } from "@/app/_wrappers/ConfiguratorQueryProvider"
import { SetupSidebarWrapper } from "@/app/_wrappers/SetupSidebarWrapper"
import { getSession } from "@/lib/auth/session"
import { redirect } from "@/lib/i18n/navigation"
import { routing } from "@/lib/i18n/routing"
import { ROUTES } from "@/lib/routes"

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function ProtectedLayout({ children, params }: Props) {
  const { locale: localeParam } = await params
  if (!hasLocale(routing.locales, localeParam)) {
    redirect({ href: ROUTES.login, locale: routing.defaultLocale })
    return null
  }

  const locale = localeParam
  const { session } = await getSession()

  if (!session?.isValid) {
    redirect({ href: ROUTES.login, locale })
  }

  return (
    <ConfiguratorQueryProvider>
      <div className="relative flex flex-1 gap-6">
        <SetupSidebarWrapper />
        <div className="flex-1">{children}</div>
      </div>
    </ConfiguratorQueryProvider>
  )
}
