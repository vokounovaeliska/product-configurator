"use client"

import { useTranslations } from "next-intl"
import { cn } from "@workspace/ui/lib/utils"

import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

export const Footer = () => {
  const t = useTranslations("Common.BaseLayout.Footer")

  return (
    <footer
      className={cn("mt-auto shrink-0 border-t border-border bg-muted/30 px-6 py-4", "lg:px-12")}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Konfiguruj</p>
        <Link
          href={ROUTES.contact}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("contact")}
        </Link>
      </div>
    </footer>
  )
}
