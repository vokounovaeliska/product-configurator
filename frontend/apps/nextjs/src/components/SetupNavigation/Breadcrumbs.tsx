"use client"

import { ChevronRightIcon, HomeIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Typography } from "@workspace/ui/components/typography"

import { Link, usePathname } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

type Props = {
  productModelId?: string
  productModelName?: string
  componentId?: string
  componentName?: string
}

export const Breadcrumbs = ({
  productModelId,
  productModelName,
  componentId,
  componentName,
}: Props) => {
  const tSetup = useTranslations("Setup")
  const tConfigurator = useTranslations("Configurator")
  const pathname = usePathname()

  // Use provided name
  const modelName = productModelName

  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs: { label: string; href: string }[] = []

  // Handle configurator route (public)
  if (segments.includes("configurator")) {
    breadcrumbs.push({
      label: tConfigurator("breadcrumbs.home"),
      href: ROUTES.home,
    })

    if (productModelId && modelName) {
      breadcrumbs.push({
        label: modelName,
        href: ROUTES.configurator(productModelId),
      })
    }

    // Don't show breadcrumbs if we only have home
    if (breadcrumbs.length <= 1) {
      return null
    }

    return (
      <nav
        aria-label="Breadcrumb"
        className="mb-6"
      >
        <ol className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1

            return (
              <li
                key={`${crumb.href}-${index}-${crumb.label}`}
                className="flex items-center gap-2"
              >
                {index > 0 && <ChevronRightIcon className="size-4 text-muted-foreground" />}
                {isLast ? (
                  <Typography
                    as="span"
                    variant="body-sm"
                    weight="semibold"
                    className="text-foreground"
                  >
                    {crumb.label}
                  </Typography>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {index === 0 ? <HomeIcon className="size-4" /> : <span>{crumb.label}</span>}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }

  // Handle setup routes (protected)
  // Always start with Setup
  breadcrumbs.push({
    label: tSetup("navigation.dashboard"),
    href: ROUTES.setup,
  })

  // Add Product Models if we're in that section
  if (segments.includes("product-models")) {
    breadcrumbs.push({
      label: tSetup("navigation.productModels"),
      href: ROUTES.setupProductModels,
    })

    // Add specific product model if we have an ID and name
    if (productModelId && modelName) {
      breadcrumbs.push({
        label: modelName,
        href: ROUTES.setupProductModels, // Link back to list
      })

      // Add Components if we're in components section
      if (segments.includes("components")) {
        breadcrumbs.push({
          label: tSetup("navigation.components"),
          href: ROUTES.setupComponents(productModelId),
        })

        // Add specific component if we have an ID and name
        if (componentId && componentName && productModelId) {
          breadcrumbs.push({
            label: componentName,
            href: ROUTES.setupComponents(productModelId), // Link back to components list
          })

          // Add Attributes if we're in attributes section
          if (segments.includes("attributes")) {
            breadcrumbs.push({
              label: tSetup("navigation.attributes"),
              href: ROUTES.setupAttributes(productModelId, componentId),
            })
          }
        }
      }
    }
  }

  // Don't show breadcrumbs if we're on the root setup page
  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6"
    >
      <ol className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <li
              key={`${crumb.href}-${index}-${crumb.label}`}
              className="flex items-center gap-2"
            >
              {index > 0 && <ChevronRightIcon className="size-4 text-muted-foreground" />}
              {isLast ? (
                <Typography
                  as="span"
                  variant="body-sm"
                  weight="semibold"
                  className="text-foreground"
                >
                  {crumb.label}
                </Typography>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {index === 0 ? <HomeIcon className="size-4" /> : <span>{crumb.label}</span>}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
