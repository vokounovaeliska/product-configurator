import { useTranslations } from "next-intl"
import Image from "next/image"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import Logo from "@/assets/configuratorLogo.png"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

export const HeaderLogo = () => {
  const t = useTranslations("Common.BaseLayout.Header.Logo")
  return (
    <Link
      href={ROUTES.home}
      className="flex items-center gap-3"
      aria-label={t("description")}
    >
      <Image
        src={Logo}
        alt={t("description")}
        className={cn("h-6 w-auto", "lg:h-8")}
        priority
      />
      <Typography
        variant="display-sm"
        weight="semibold"
        className="max-lg:hidden"
      >
        {t("description")}
      </Typography>
    </Link>
  )
}
