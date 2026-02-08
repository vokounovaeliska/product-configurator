"use client"

import { useEffect, useState } from "react"
import { ChevronRightIcon, HomeIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import type { ProductModelDto } from "@/api/productModelTypes"
import { api } from "@/lib/api/restClient"
import { Link, usePathname } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

type Props = {
  productModelId?: string
  productModelName?: string
  componentId?: string
  componentName?: string
  attributeId?: string
  attributeName?: string
}

export const Breadcrumbs = ({
  productModelId,
  productModelName,
  componentId,
  componentName,
  attributeId: attributeIdProp,
  attributeName: attributeNameProp,
}: Props) => {
  const tSetup = useTranslations("Setup")
  const tConfigurator = useTranslations("Configurator")
  const pathname = usePathname()

  const [fetchedModelName, setFetchedModelName] = useState<string | null>(null)
  const [fetchedComponentName, setFetchedComponentName] = useState<string | null>(null)
  const [fetchedAttributeName, setFetchedAttributeName] = useState<string | null>(null)

  const segments = pathname.split("/").filter(Boolean)
  const isSetupProductModels = segments.includes("product-models")
  const resolvedProductModelId =
    productModelId ??
    (isSetupProductModels ? segments[segments.indexOf("product-models") + 1] : undefined)
  const resolvedComponentId =
    componentId ??
    (segments.includes("components") ? segments[segments.indexOf("components") + 1] : undefined)
  const resolvedAttributeId =
    attributeIdProp ??
    (segments.includes("attributes") ? segments[segments.indexOf("attributes") + 1] : undefined)

  useEffect(() => {
    if (!isSetupProductModels || !resolvedProductModelId) {
      setFetchedModelName(null)
      setFetchedComponentName(null)
      setFetchedAttributeName(null)
      return
    }

    if (!productModelName && resolvedProductModelId) {
      api
        .get(`products/api/v1/product-models/${resolvedProductModelId}`)
        .json<ProductModelDto>()
        .then((m) => setFetchedModelName(m.name))
        .catch(() => {
          /* use fallback name */
        })
    }
    if (!componentName && resolvedComponentId) {
      api
        .get(
          `products/api/v1/product-models/${resolvedProductModelId}/components/${resolvedComponentId}`,
        )
        .json<ComponentDto>()
        .then((c) => setFetchedComponentName(c.label))
        .catch(() => {
          /* use fallback name */
        })
    }
    if (!attributeNameProp && resolvedAttributeId && resolvedComponentId) {
      api
        .get(
          `products/api/v1/product-models/${resolvedProductModelId}/components/${resolvedComponentId}/attributes/${resolvedAttributeId}`,
        )
        .json<AttributeDto>()
        .then((a) => setFetchedAttributeName(a.label))
        .catch(() => {
          /* use fallback name */
        })
    }
  }, [
    isSetupProductModels,
    resolvedProductModelId,
    resolvedComponentId,
    resolvedAttributeId,
    productModelName,
    componentName,
    attributeNameProp,
  ])

  const modelName = productModelName ?? fetchedModelName
  const resolvedComponentName = componentName ?? fetchedComponentName
  const resolvedAttributeName = attributeNameProp ?? fetchedAttributeName

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

    if (resolvedProductModelId) {
      if (modelName) {
        breadcrumbs.push({
          label: modelName,
          href: ROUTES.setupComponents(resolvedProductModelId),
        })
      }

      // Add Components section (names only, no "Components" label)
      if (segments.includes("components") && resolvedComponentId) {
        if (resolvedComponentName) {
          breadcrumbs.push({
            label: resolvedComponentName,
            href: ROUTES.setupAttributes(resolvedProductModelId, resolvedComponentId),
          })
        }

        // Add Attributes section (names only, no "Attributes" / "Options" labels)
        if (segments.includes("attributes") && resolvedAttributeId) {
          if (resolvedAttributeName) {
            breadcrumbs.push({
              label: resolvedAttributeName,
              href: ROUTES.setupAttributeOptions(
                resolvedProductModelId,
                resolvedComponentId,
                resolvedAttributeId,
              ),
            })
          }
          // Only show "Pricing" when on pricing page (current page label)
          if (segments.includes("pricing")) {
            breadcrumbs.push({
              label: tSetup("navigation.pricing"),
              href: ROUTES.setupAttributePricing(
                resolvedProductModelId,
                resolvedComponentId,
                resolvedAttributeId,
              ),
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
