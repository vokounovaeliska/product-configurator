import Image from "next/image"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import Logo from "@/assets/konfigurujLogo.png"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

type Props = {
  href?: string
  logoDescription: string
}

export const HeaderLogo = ({ href = ROUTES.home, logoDescription }: Props) => {
  return (
    <Link
      href={href}
      className="flex min-h-[44px] min-w-0 shrink items-center gap-3 py-2 lg:min-w-0"
      aria-label={logoDescription}
    >
      <Image
        src={Logo}
        alt={logoDescription}
        className={cn("h-6 w-auto dark:invert", "lg:h-8")}
        priority
      />
      <Typography
        variant="display-sm"
        weight="semibold"
        className="max-lg:hidden"
      >
        {logoDescription}
      </Typography>
    </Link>
  )
}
