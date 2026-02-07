"use client"

import { useState } from "react"
import { ListIcon, PencilIcon, TrashIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeDto } from "@/api/attributeTypes"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { DeleteAttributeDialog } from "./DeleteAttributeDialog"
import { EditAttributeDialog } from "./EditAttributeDialog"

type Props = {
  attribute: AttributeDto
  productModelId: string
  componentId: string
}

export const AttributeCard = ({ attribute, productModelId, componentId }: Props) => {
  const t = useTranslations("Attributes")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const getRangeDisplay = () => {
    const unitSuffix =
      (attribute.type === "INTEGER" || attribute.type === "DECIMAL") && attribute.unit?.trim()
        ? ` ${attribute.unit.trim()}`
        : ""
    if (attribute.type === "INTEGER") {
      if (attribute.minInt != null && attribute.maxInt != null) {
        return `${attribute.minInt} - ${attribute.maxInt}${unitSuffix}`
      }
      if (attribute.minInt != null) {
        return `≥ ${attribute.minInt}${unitSuffix}`
      }
      if (attribute.maxInt != null) {
        return `≤ ${attribute.maxInt}${unitSuffix}`
      }
    }
    if (attribute.type === "DECIMAL") {
      if (attribute.minDecimal != null && attribute.maxDecimal != null) {
        return `${attribute.minDecimal} - ${attribute.maxDecimal}${unitSuffix}`
      }
      if (attribute.minDecimal != null) {
        return `≥ ${attribute.minDecimal}${unitSuffix}`
      }
      if (attribute.maxDecimal != null) {
        return `≤ ${attribute.maxDecimal}${unitSuffix}`
      }
    }
    return null
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Typography
                  as="h3"
                  variant="display-md"
                  weight="semibold"
                  className="line-clamp-2"
                >
                  {attribute.label}
                </Typography>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {attribute.type}
                </span>
                {attribute.isRequired && (
                  <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                    {t("card.required")}
                  </span>
                )}
              </div>
              <Typography
                as="p"
                variant="body-sm"
                className="mt-1 text-muted-foreground"
              >
                {attribute.code}
              </Typography>
            </div>
          </div>

          {getRangeDisplay() && (
            <Typography
              as="p"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("card.range")}: {getRangeDisplay()}
            </Typography>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <Typography
              as="p"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("card.sortOrder")}: {attribute.sortOrder}
            </Typography>
            <div className="flex gap-2">
              {attribute.type === "ENUM" && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link
                    href={ROUTES.setupAttributeOptions(productModelId, componentId, attribute.id)}
                  >
                    <ListIcon className="size-4" />
                    <span className="sr-only">{t("card.manageOptionsButton")}</span>
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <PencilIcon className="size-4" />
                <span className="sr-only">{t("card.editButton")}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <TrashIcon className="size-4" />
                <span className="sr-only">{t("card.deleteButton")}</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <EditAttributeDialog
        attribute={attribute}
        productModelId={productModelId}
        componentId={componentId}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <DeleteAttributeDialog
        attribute={attribute}
        productModelId={productModelId}
        componentId={componentId}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  )
}
