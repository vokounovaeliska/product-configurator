"use client"

import { useTranslations } from "next-intl"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

type Props = {
  basePrice: number
  currency: string

  totalPrice?: number

  modifiersCents?: number

  isLoading?: boolean

  isUpdating?: boolean

  isCompact?: boolean
}

export const PriceDisplay = ({
  basePrice,
  currency,
  totalPrice: totalPriceProp,
  modifiersCents = 0,
  isLoading,
  isUpdating = false,
  isCompact = false,
}: Props) => {
  const t = useTranslations("Configurator")

  const formatPrice = (price: number, currencyCode: string) => {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(price)
  }

  const totalPrice = totalPriceProp ?? basePrice
  const modifierInMainUnit = modifiersCents / 100
  const hasModifier = modifiersCents > 0

  if (isLoading) {
    return (
      <Card className={isCompact ? "p-3" : "p-6"}>
        <div className={isCompact ? "flex items-center justify-between gap-4" : "space-y-2"}>
          {!isCompact && (
            <Typography
              as="h3"
              variant="display-sm"
              weight="semibold"
            >
              {t("price.title")}
            </Typography>
          )}
          <Skeleton className={isCompact ? "h-6 w-24" : "h-8 w-32"} />
        </div>
      </Card>
    )
  }

  if (isCompact) {
    return (
      <Card className="shrink-0 border-primary/20 bg-primary/5 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography
            as="span"
            variant="body-sm"
            weight="medium"
            className="text-muted-foreground"
          >
            {t("price.title")}
          </Typography>
          <div className="flex items-center gap-2">
            <Typography
              as="span"
              variant="display-sm"
              weight="bold"
              className={`text-primary ${isUpdating ? "opacity-70" : ""}`}
            >
              {formatPrice(totalPrice, currency)}
            </Typography>
            {isUpdating && (
              <span
                className="inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
                aria-hidden
              />
            )}
          </div>
        </div>
        {hasModifier && (
          <Typography
            as="p"
            variant="body-sm"
            className="mt-1 text-muted-foreground"
          >
            {t("price.basePlusModifier", {
              base: formatPrice(basePrice, currency),
              modifier: formatPrice(modifierInMainUnit, currency),
            })}
          </Typography>
        )}
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-2">
        <Typography
          as="h3"
          variant="display-sm"
          weight="semibold"
        >
          {t("price.title")}
        </Typography>
        <Typography
          as="p"
          variant="display-lg"
          weight="bold"
          className={`text-primary ${isUpdating ? "opacity-70" : ""}`}
        >
          {formatPrice(totalPrice, currency)}
          {isUpdating && (
            <span
              className="ml-2 inline-block size-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
              aria-hidden
            />
          )}
        </Typography>
        {hasModifier && (
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("price.basePlusModifier", {
              base: formatPrice(basePrice, currency),
              modifier: formatPrice(modifierInMainUnit, currency),
            })}
          </Typography>
        )}
      </div>
    </Card>
  )
}
