"use client"

import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { Link, usePathname } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

export type NavLink = {
  path: string
  label: string
}

export const HeaderNavLink = ({ path, label }: NavLink) => {
  const currentPath = usePathname()
  const isActive =
    currentPath === path || (currentPath.startsWith(path) && currentPath !== ROUTES.home)

  return (
    <li>
      <Typography
        asChild
        variant="body-lg"
        weight="semibold"
      >
        <Link
          href={path}
          className={cn(
            "rounded-full px-2 py-1 text-muted-foreground transition-colors duration-200 ease-out",
            "lg:px-3 lg:py-1.5",
            "hover:text-foreground",
            { "bg-accent": isActive },
          )}
        >
          {label}
        </Link>
      </Typography>
    </li>
  )
}
