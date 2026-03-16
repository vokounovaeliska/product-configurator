"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import { useProductModelsList } from "../api/productModelQueries"
import { CreateProductModelDialog } from "./CreateProductModelDialog"
import { ProductModelCard } from "./ProductModelCard"

export const ProductModelsList = () => {
  const t = useTranslations("ProductModels")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data, isLoading, error } = useProductModelsList({ limit: 50 })

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <Typography
          as="p"
          variant="body-md"
          className="text-destructive"
        >
          {t("list.errorMessage")}
        </Typography>
      </div>
    )
  }

  const productModels = data?.items ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Typography
          as="h2"
          variant="display-lg"
          weight="semibold"
          className="min-w-0"
        >
          {t("list.title")}
        </Typography>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full shrink-0 sm:w-auto"
        >
          {t("list.createButton")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-48 rounded-lg"
            />
          ))}
        </div>
      ) : productModels.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Typography
            as="p"
            variant="body-lg"
            className="mb-4 text-muted-foreground"
          >
            {t("list.emptyState.message")}
          </Typography>
          <Button
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            {t("list.emptyState.createButton")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {productModels.map((productModel) => (
            <ProductModelCard
              key={productModel.id}
              productModel={productModel}
            />
          ))}
        </div>
      )}

      <CreateProductModelDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}
