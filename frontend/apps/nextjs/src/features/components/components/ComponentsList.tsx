"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import { useComponentsList } from "../api/componentQueries"
import { ComponentCard } from "./ComponentCard"
import { CreateComponentDialog } from "./CreateComponentDialog"

type Props = {
  productModelId: string
}

export const ComponentsList = ({ productModelId }: Props) => {
  const t = useTranslations("Components")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data, isLoading, error } = useComponentsList(productModelId, { limit: 100 })

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

  const components = data?.items ?? []

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
      ) : components.length === 0 ? (
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
          {components.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              productModelId={productModelId}
            />
          ))}
        </div>
      )}

      <CreateComponentDialog
        productModelId={productModelId}
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}
