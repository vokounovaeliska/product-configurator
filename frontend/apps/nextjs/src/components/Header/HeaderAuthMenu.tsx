"use client"

import type { User } from "better-auth"
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useAuth } from "@/hooks/useAuth"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

type Props = {
  user: User | null
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

  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage
          src={user.image ?? ""}
          alt={`${user.name} avatar`}
        />
        <AvatarFallback className="text-sm text-muted-foreground">{user.name[0]}</AvatarFallback>
      </Avatar>

      <Button onClick={() => signOut()}>{t("logout")}</Button>
    </div>
  )
}
