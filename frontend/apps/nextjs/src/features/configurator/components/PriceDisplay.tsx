"use client"

import { useTranslations } from "next-intl"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

type Props = {
  basePrice: number
  currency: string
  /** Total price from configuration preview (base + modifiers). When undefined, basePrice is shown. */
  totalPrice?: number
  /** Modifier in cents (added to base). When > 0, shown as "+ X" next to base. */
  modifiersCents?: number
  /** True when no price data yet (show skeleton). */
  isLoading?: boolean
  /** True when refetching in background (show subtle updating state, keep showing current price). */
  isUpdating?: boolean
}

export const PriceDisplay = ({
  basePrice,
  currency,
  totalPrice: totalPriceProp,
  modifiersCents = 0,
  isLoading,
  isUpdating = false,
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
      <Card className="p-6">
        <div className="space-y-2">
          <Typography
            as="h3"
            variant="display-sm"
            weight="semibold"
          >
            {t("price.title")}
          </Typography>
          <Skeleton className="h-8 w-32" />
        </div>
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
