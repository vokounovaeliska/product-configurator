"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import { useAttributesList } from "../api/attributeQueries"
import { AttributeCard } from "./AttributeCard"
import { CreateAttributeDialog } from "./CreateAttributeDialog"

type Props = {
  productModelId: string
  componentId: string
}

export const AttributesList = ({ productModelId, componentId }: Props) => {
  const t = useTranslations("Attributes")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data, isLoading, error } = useAttributesList(productModelId, componentId, {
    limit: 100,
  })

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

  const attributes = data?.items ?? []

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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-48 rounded-lg"
            />
          ))}
        </div>
      ) : attributes.length === 0 ? (
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
          {attributes.map((attribute) => (
            <AttributeCard
              key={attribute.id}
              attribute={attribute}
              productModelId={productModelId}
              componentId={componentId}
            />
          ))}
        </div>
      )}

      <CreateAttributeDialog
        productModelId={productModelId}
        componentId={componentId}
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}
