"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  ListIcon,
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
  productModelName?: string | null
}

export const SetupSidebar = ({
  components = [],
  isLoadingComponents = false,
  productModelName = null,
}: Props) => {
  const t = useTranslations("Setup")
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()

  const pathSegments = pathname.split("/").filter(Boolean)
  const productModelIndex = pathSegments.indexOf("product-models")
  const productModelId =
    productModelIndex !== -1 && pathSegments[productModelIndex + 1]
      ? pathSegments[productModelIndex + 1]
      : null
  const componentsIndex = pathSegments.indexOf("components")
  const componentIdFromPath =
    componentsIndex !== -1 && pathSegments[componentsIndex + 1]
      ? pathSegments[componentsIndex + 1]
      : null

  const sortedComponents = [...components].sort((a, b) => a.sortOrder - b.sortOrder)
  const currentComponent = componentIdFromPath
    ? sortedComponents.find((c) => c.id === componentIdFromPath)
    : null

  const isOnAttributes = (componentId: string) =>
    productModelId &&
    (pathname === ROUTES.setupAttributes(productModelId, componentId) ||
      pathname.startsWith(ROUTES.setupAttributes(productModelId, componentId) + "/"))

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

                  {showComponents && (
                    <div className="ml-3 space-y-0.5 border-l border-border pl-3">
                      {productModelName && (
                        <div className="mt-1 mb-2 px-2">
                          <Typography
                            as="p"
                            variant="body-sm"
                            weight="semibold"
                            className="truncate text-muted-foreground"
                          >
                            {productModelName}
                          </Typography>
                          {currentComponent && (
                            <Typography
                              as="p"
                              variant="body-sm"
                              className="truncate text-muted-foreground/80"
                            >
                              {currentComponent.label}
                            </Typography>
                          )}
                        </div>
                      )}
                      {isLoadingComponents ? (
                        <div className="space-y-2 py-1">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton
                              key={i}
                              className="h-7 w-full"
                            />
                          ))}
                        </div>
                      ) : sortedComponents.length > 0 ? (
                        <>
                          <Link
                            href={ROUTES.setupComponents(productModelId)}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                              pathname === ROUTES.setupComponents(productModelId)
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            )}
                          >
                            <ListIcon className="size-3.5 shrink-0" />
                            <span className="truncate">{t("navigation.allComponents")}</span>
                          </Link>
                          {sortedComponents.map((component) => {
                            const attributesHref = ROUTES.setupAttributes(
                              productModelId,
                              component.id,
                            )
                            const isAttributesActive = isOnAttributes(component.id)

                            return (
                              <Link
                                key={component.id}
                                href={attributesHref}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                                  isAttributesActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                )}
                                title={component.description ?? undefined}
                              >
                                <PackageIcon className="size-3.5 shrink-0" />
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
