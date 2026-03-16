import { cn } from "@workspace/ui/lib/utils"

import { getSession } from "@/lib/auth/session"
import { ROUTES } from "@/lib/routes"

import { SidebarToggle } from "../SetupNavigation/SidebarToggle"
import { HeaderLogo } from "./HeaderLogo"
import { HeaderMenu } from "./HeaderMenu"
import { HeaderNav } from "./HeaderNav"
import { HeaderRoot } from "./HeaderRoot"

type Props = {
  pathname?: string
}

export const Header = async ({ pathname = "" }: Props) => {
  const { session } = await getSession()
  const logoHref = session?.isValid ? ROUTES.setup : ROUTES.home
  const isSetupRoute = pathname.includes("/setup")
  const isContactWithSidebar = pathname.includes("contact") && session?.isValid
  const shouldShowHamburger = isSetupRoute || isContactWithSidebar

  return (
    <HeaderRoot>
      <div className={cn("flex min-w-0 shrink items-center gap-1", "sm:gap-2 lg:gap-12")}>
        {shouldShowHamburger && (
          <div className="lg:hidden">
            <SidebarToggle />
          </div>
        )}
        <HeaderLogo href={logoHref} />
        <HeaderNav />
      </div>
      <HeaderMenu />
    </HeaderRoot>
  )
}
