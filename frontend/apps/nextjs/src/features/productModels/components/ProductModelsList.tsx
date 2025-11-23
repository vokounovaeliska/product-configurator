"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Typography } from "@workspace/ui/components/typography"

import { CreateProductModelDialog } from "./CreateProductModelDialog"

export const ProductModelsList = () => {
  const t = useTranslations("ProductModels")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // TODO: Fetch product models from API
  const productModels: Record<string, unknown>[] = []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Typography
          as="h2"
          variant="display-lg"
          weight="semibold"
        >
          {t("list.title")}
        </Typography>
        <Button onClick={() => setIsCreateDialogOpen(true)}>{t("list.createButton")}</Button>
      </div>

      {productModels.length === 0 ? (
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
          {/* TODO: Map over product models */}
        </div>
      )}

      <CreateProductModelDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}
