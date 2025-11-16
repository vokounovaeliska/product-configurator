import { cn } from "@workspace/ui/lib/utils"

import { HeaderLogo } from "./HeaderLogo"
import { HeaderMenu } from "./HeaderMenu"
import { HeaderNav } from "./HeaderNav"
import { HeaderRoot } from "./HeaderRoot"

export const Header = () => {
  return (
    <HeaderRoot>
      <div className={cn("flex items-center gap-4", "lg:gap-12")}>
        <HeaderLogo />
        <HeaderNav />
      </div>
      <HeaderMenu />
    </HeaderRoot>
  )
}
