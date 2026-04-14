"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

const STORAGE_KEY = "konfiguruj_cookie_notice_v1"

function isEmbeddedInIframe(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

export const CookieConsentBanner = () => {
  const t = useTranslations("Legal.CookieBanner")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    try {
      if (isEmbeddedInIframe()) {
        setIsVisible(false)
        return
      }
      setIsVisible(localStorage.getItem(STORAGE_KEY) !== "1")
    } catch {
      setIsVisible(true)
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      /* ignore */
    }
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-label={t("ariaLabel")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur-sm",
        "supports-[padding:max(0px)]:pb-[max(1rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t.rich("message", {
            privacy: (chunks) => (
              <Link
                href={ROUTES.privacy}
                className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
              >
                {chunks}
              </Link>
            ),
            cookies: (chunks) => (
              <Link
                href={ROUTES.cookies}
                className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
              >
                {chunks}
              </Link>
            ),
          })}
        </Typography>
        <Button
          type="button"
          onClick={accept}
          className="shrink-0 sm:min-w-[8rem]"
        >
          {t("accept")}
        </Button>
      </div>
    </div>
  )
}
