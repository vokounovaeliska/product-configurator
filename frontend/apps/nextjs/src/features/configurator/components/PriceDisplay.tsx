"use client"

import { useTranslations } from "next-intl"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"

type Props = {
  basePrice: number
  currency: string
}

export const PriceDisplay = ({ basePrice, currency }: Props) => {
  const t = useTranslations("Configurator")

  const formatPrice = (price: number, currencyCode: string) => {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(price)
  }

  // TODO: Calculate total price including attribute modifiers
  const totalPrice = basePrice

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
          className="text-primary"
        >
          {formatPrice(totalPrice, currency)}
        </Typography>
        {totalPrice !== basePrice && (
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground line-through"
          >
            {formatPrice(basePrice, currency)}
          </Typography>
        )}
      </div>
    </Card>
  )
}
