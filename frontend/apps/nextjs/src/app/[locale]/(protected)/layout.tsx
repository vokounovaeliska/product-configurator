import { hasLocale } from "next-intl"

import { SidebarToggle } from "@/components/SetupNavigation/SidebarToggle"
import { SidebarProvider } from "@/components/SetupNavigation/useSidebar"
import { getSession } from "@/lib/auth/session"
import { redirect } from "@/lib/i18n/navigation"
import { routing } from "@/lib/i18n/routing"
import { ROUTES } from "@/lib/routes"

import { SetupSidebarWrapper } from "./SetupSidebarWrapper"

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

  // After hasLocale check, localeParam is guaranteed to be a valid Locale
  const locale = localeParam
  const { session } = await getSession()

  if (!session?.isValid) {
    redirect({ href: ROUTES.login, locale })
  }

  return (
    <SidebarProvider>
      <div className="flex flex-1 gap-6">
        <SetupSidebarWrapper />
        <SidebarToggle />
        <div className="flex-1">{children}</div>
      </div>
    </SidebarProvider>
  )
}
