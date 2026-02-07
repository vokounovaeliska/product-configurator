"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import { useAttributeOptionsList, useDeleteAttributeOption } from "../api/attributeOptionQueries"
import { AttributeOptionCard } from "./AttributeOptionCard"
import { CreateAttributeOptionDialog } from "./CreateAttributeOptionDialog"
import { DeleteAttributeOptionDialog } from "./DeleteAttributeOptionDialog"

type Props = {
  productModelId: string
  componentId: string
  attributeId: string
}

export const AttributeOptionsList = ({ productModelId, componentId, attributeId }: Props) => {
  const t = useTranslations("AttributeOptions")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteOptionId, setDeleteOptionId] = useState<string | null>(null)

  const {
    data: options,
    isLoading,
    isError,
  } = useAttributeOptionsList(productModelId, componentId, attributeId)
  const deleteMutation = useDeleteAttributeOption(productModelId, componentId, attributeId)

  const handleDeleteConfirm = () => {
    if (!deleteOptionId) return
    deleteMutation.mutate(deleteOptionId, {
      onSuccess: () => setDeleteOptionId(null),
    })
  }

  if (isError) {
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

  const optionList = options ?? []

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
        <Button onClick={() => setIsCreateOpen(true)}>{t("list.createButton")}</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-32 rounded-lg"
            />
          ))}
        </div>
      ) : optionList.length === 0 ? (
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
            onClick={() => setIsCreateOpen(true)}
          >
            {t("list.emptyState.createButton")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {optionList
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((option) => (
              <AttributeOptionCard
                key={option.id}
                option={option}
                productModelId={productModelId}
                componentId={componentId}
                attributeId={attributeId}
                onDelete={() => setDeleteOptionId(option.id)}
              />
            ))}
        </div>
      )}

      <CreateAttributeOptionDialog
        productModelId={productModelId}
        componentId={componentId}
        attributeId={attributeId}
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <DeleteAttributeOptionDialog
        isOpen={deleteOptionId !== null}
        onOpenChange={(isOpen) => !isOpen && setDeleteOptionId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
