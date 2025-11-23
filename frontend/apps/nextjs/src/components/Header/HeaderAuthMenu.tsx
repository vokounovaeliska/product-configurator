"use client"

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
        >
          {t("signIn")}
        </Link>
        <Link
          href={ROUTES.registration}
          className={cn(buttonVariants({ variant: "secondary" }))}
        >
          {t("signUp")}
        </Link>
      </>
    )
  }

  const displayName = user.name ?? user.email ?? ""
  const initial = displayName?.charAt(0).toUpperCase() ?? "U"

  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage
          src=""
          alt={displayName ?? "User avatar"}
        />
        <AvatarFallback className="text-sm text-muted-foreground">{initial}</AvatarFallback>
      </Avatar>

      {displayName && <span className="text-sm font-medium text-foreground">{displayName}</span>}

      <Button onClick={() => signOut()}>{t("logout")}</Button>
    </div>
  )
}
