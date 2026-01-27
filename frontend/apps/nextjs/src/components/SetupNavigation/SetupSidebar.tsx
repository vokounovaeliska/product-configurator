"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  PackageIcon,
  SettingsIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import type { ComponentDto } from "@/api/componentTypes"
import { Link, usePathname } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { useSidebar } from "./useSidebar"

type Props = {
  components?: ComponentDto[]
  isLoadingComponents?: boolean
}

export const SetupSidebar = ({ components = [], isLoadingComponents = false }: Props) => {
  const t = useTranslations("Setup")
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()

  // Extract productModelId from pathname if we're on a product model or components page
  const pathSegments = pathname.split("/").filter(Boolean)
  const productModelIndex = pathSegments.indexOf("product-models")
  const productModelId =
    productModelIndex !== -1 && pathSegments[productModelIndex + 1]
      ? pathSegments[productModelIndex + 1]
      : null

  const sortedComponents = [...components].sort((a, b) => a.sortOrder - b.sortOrder)

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
        <div className={cn("flex h-full flex-col", isOpen ? "p-6" : "p-2")}>
          <div
            className={cn("mb-6 flex items-center", isOpen ? "justify-between" : "justify-center")}
          >
            {isOpen ? (
              <>
                <Typography
                  as="h2"
                  variant="display-sm"
                  weight="semibold"
                  className="flex items-center gap-2"
                >
                  <SettingsIcon className="size-5" />
                  {t("navigation.title")}
                </Typography>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggle}
                  className="hover:bg-accent"
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
                <ChevronLeftIcon className="size-4 rotate-180" />
              </Button>
            )}
          </div>

          <nav className="space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              const Icon = item.icon
              const isProductModels = item.href === ROUTES.setupProductModels
              const showComponents = isProductModels && productModelId && isOpen

              return (
                <div
                  key={item.href}
                  className="space-y-1"
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg text-sm font-medium transition-colors",
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

                  {/* Show components when on a product model page */}
                  {showComponents && (
                    <div className="ml-4 space-y-1 border-l pl-3">
                      {isLoadingComponents ? (
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton
                              key={i}
                              className="h-8 w-full"
                            />
                          ))}
                        </div>
                      ) : sortedComponents.length > 0 ? (
                        <>
                          <Link
                            href={ROUTES.setupComponents(productModelId)}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                              pathname.includes("/components") &&
                                !pathname.includes(productModelId + "/components/")
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            )}
                          >
                            <ChevronRightIcon className="size-3 shrink-0" />
                            <span className="truncate">{t("navigation.allComponents")}</span>
                          </Link>
                          {sortedComponents.map((component) => {
                            const isComponentActive = pathname.includes(
                              `/product-models/${productModelId}/components/${component.id}`,
                            )

                            return (
                              <Link
                                key={component.id}
                                href={ROUTES.setupComponents(productModelId)}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors",
                                  isComponentActive
                                    ? "bg-primary/10 font-medium text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                )}
                                title={component.description ?? undefined}
                              >
                                <PackageIcon className="size-3 shrink-0" />
                                <span className="truncate">{component.label}</span>
                              </Link>
                            )
                          })}
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={toggle}
          aria-hidden="true"
        />
      )}
    </>
  )
}
