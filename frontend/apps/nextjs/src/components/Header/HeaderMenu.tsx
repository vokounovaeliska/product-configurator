import { cn } from "@workspace/ui/lib/utils"

import { getSession } from "@/lib/auth/session"

import { HeaderAuthMenu } from "./HeaderAuthMenu"
import { LanguageSwitcher } from "./LanguageSwitcher/LanguageSwitcher"
import { ThemeSwitcher } from "./ThemeSwitcher/ThemeSwitcher"

export const HeaderMenu = async () => {
  const { user } = await getSession()

  return (
    <div className={cn("flex min-w-0 shrink items-center gap-0.5", "sm:gap-1 lg:gap-2")}>
      <HeaderAuthMenu user={user} />
      <LanguageSwitcher />
      <ThemeSwitcher />
    </div>
  )
}
