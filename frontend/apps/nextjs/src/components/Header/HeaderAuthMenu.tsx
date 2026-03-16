"use client"

import { LogOut } from "lucide-react"
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useAuth } from "@/hooks/useAuth"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

type HeaderUser = {
  id: string
  email: string
  name?: string | null
}

type Props = {
  user: HeaderUser | null
}

export const HeaderAuthMenu = ({ user }: Props) => {
  const { signOut } = useAuth()

  const t = useTranslations("Common.BaseLayout.Header.AuthMenu")

  if (!user) {
    return (
      <>
        <Link
          href={ROUTES.login}
          className={cn(buttonVariants())}
          prefetch={false}
        >
          {t("signIn")}
        </Link>
        <Link
          href={ROUTES.registration}
          className={cn(buttonVariants({ variant: "secondary" }))}
          prefetch={false}
        >
          {t("signUp")}
        </Link>
      </>
    )
  }

  const displayName = user.name ?? user.email ?? ""
  const initial = displayName?.charAt(0).toUpperCase() ?? "U"

  return (
    <div className="flex min-w-0 shrink items-center gap-1 sm:gap-2 lg:gap-4">
      <Avatar className="size-8 shrink-0 lg:size-9">
        <AvatarImage
          src=""
          alt={displayName ?? "User avatar"}
        />
        <AvatarFallback className="text-xs text-muted-foreground">{initial}</AvatarFallback>
      </Avatar>

      {displayName && (
        <span className="hidden truncate text-sm font-medium text-foreground lg:block">
          {displayName}
        </span>
      )}

      <Button
        onClick={() => signOut()}
        variant="ghost"
        size="icon"
        className="min-h-[44px] min-w-[44px] shrink-0 sm:hidden"
        aria-label={t("logout")}
      >
        <LogOut className="size-4" />
      </Button>
      <Button
        onClick={() => signOut()}
        className="hidden min-h-[44px] shrink-0 px-3 sm:inline-flex lg:px-4"
      >
        {t("logout")}
      </Button>
    </div>
  )
}
