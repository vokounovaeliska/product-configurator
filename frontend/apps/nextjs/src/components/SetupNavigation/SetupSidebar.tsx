"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FileUpIcon,
  InboxIcon,
  LayoutDashboardIcon,
  PackageIcon,
  SendIcon,
  SettingsIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { Link, usePathname } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { useSidebar } from "./useSidebar"

type Props = Record<string, never>

export const SetupSidebar = (_props: Props) => {
  const t = useTranslations("Setup")
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()

  const navItems = [
    {
      href: ROUTES.setup,
      label: t("navigation.dashboard"),
      icon: LayoutDashboardIcon,
      exact: true,
    },
    {
      href: ROUTES.setupProductModels,
      label: t("navigation.productModels"),
      icon: PackageIcon,
      exact: false,
    },
    {
      href: ROUTES.setupImportSketchup,
      label: t("navigation.importSketchup"),
      icon: FileUpIcon,
      exact: true,
    },
    {
      href: ROUTES.setupPublish,
      label: t("navigation.publish"),
      icon: SendIcon,
      exact: true,
    },
    {
      href: ROUTES.setupCustomerRequests,
      label: t("navigation.customerRequests"),
      icon: InboxIcon,
      exact: true,
    },
  ]

  return (
    <>
      <aside
        className={cn(
          "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] border-r bg-muted/30 transition-all duration-300 lg:relative lg:top-0 lg:h-screen",
          isOpen ? "w-64 translate-x-0" : "-translate-x-full lg:w-16 lg:translate-x-0",
          "lg:shrink-0",
        )}
      >
        <div className={cn("flex h-full flex-col", isOpen ? "p-4" : "p-2")}>
          <div
            className={cn("mb-4 flex items-center", isOpen ? "justify-between" : "justify-center")}
          >
            {isOpen ? (
              <>
                <Typography
                  as="h2"
                  variant="display-sm"
                  weight="semibold"
                  className="flex items-center gap-2 truncate"
                >
                  <SettingsIcon className="size-5 shrink-0" />
                  <span className="truncate">{t("navigation.title")}</span>
                </Typography>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggle}
                  className="shrink-0 hover:bg-accent"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                className="w-full hover:bg-accent"
                aria-label="Expand sidebar"
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            )}
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-[44px] items-center rounded-lg text-sm font-medium transition-colors lg:min-h-0",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    isOpen ? "gap-3 px-3 py-2" : "justify-center p-2",
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  <Icon className={cn("shrink-0", isOpen ? "size-4" : "size-5")} />
                  {isOpen && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={toggle}
          aria-hidden="true"
          style={{ touchAction: "manipulation" }}
        />
      )}
    </>
  )
}
