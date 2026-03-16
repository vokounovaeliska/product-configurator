"use client"

import { useState } from "react"
import { ExternalLinkIcon, PencilIcon, TrashIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import type { ProductModelDto } from "@/api/productModelTypes"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { DeleteProductModelDialog } from "./DeleteProductModelDialog"
import { EditProductModelDialog } from "./EditProductModelDialog"
import { ProductModelThumbnail } from "./ProductModelThumbnail"

type Props = {
  productModel: ProductModelDto
}

export const ProductModelCard = ({ productModel }: Props) => {
  const t = useTranslations("ProductModels")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price)
  }

  return (
    <>
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <ProductModelThumbnail
            productModelId={productModel.id}
            model3dUrl={productModel.model3dUrl}
            model3dEffects={productModel.model3dEffects}
          />
          <div className="flex items-start justify-between gap-2">
            <Typography
              as="h3"
              variant="display-md"
              weight="semibold"
              className="line-clamp-2 flex-1"
            >
              {productModel.name}
            </Typography>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                productModel.isActive
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {productModel.isActive ? t("card.active") : t("card.inactive")}
            </span>
          </div>

          {productModel.description && (
            <Typography
              as="p"
              variant="body-md"
              className="line-clamp-3 text-muted-foreground"
            >
              {productModel.description}
            </Typography>
          )}

          <div className="space-y-3 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Typography
                as="p"
                variant="body-lg"
                weight="semibold"
              >
                {formatPrice(productModel.price, productModel.currency)}
              </Typography>
              <div className="flex shrink-0 gap-2">
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
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Link
                href={ROUTES.setupComponents(productModel.id)}
                className="min-w-0 flex-1"
              >
                <Button
                  variant="outline"
                  className="min-h-10 w-full touch-manipulation"
                >
                  {t("card.manageComponentsButton")}
                </Button>
              </Link>
              {productModel.isActive && (
                <Link
                  href={ROUTES.configurator(productModel.id)}
                  className="min-w-0 flex-1"
                >
                  <Button
                    variant="default"
                    className="min-h-10 w-full touch-manipulation"
                  >
                    {t("card.configureButton")}
                    <ExternalLinkIcon className="ml-2 size-4 shrink-0" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>

      <EditProductModelDialog
        productModel={productModel}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <DeleteProductModelDialog
        productModel={productModel}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  )
}
