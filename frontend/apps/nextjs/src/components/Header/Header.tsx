import { cn } from "@workspace/ui/lib/utils"

import { HeaderLogo } from "./HeaderLogo"
import { HeaderMenu } from "./HeaderMenu"
import { HeaderNav } from "./HeaderNav"
import { HeaderRoot } from "./HeaderRoot"

export const Header = () => {
  return (
    <HeaderRoot>
      <div className={cn("flex min-w-0 shrink items-center gap-2", "lg:gap-12")}>
        <HeaderLogo />
        <HeaderNav />
      </div>
      <HeaderMenu />
    </HeaderRoot>
  )
}
