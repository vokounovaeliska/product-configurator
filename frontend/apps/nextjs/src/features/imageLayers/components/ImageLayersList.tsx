"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import { getImageUrl } from "@/utils/imageUrl"

import {
  useCreateImageLayer,
  useDeleteImageLayer,
  useImageLayersList,
} from "../api/imageLayerQueries"
import { CreateImageLayerDialog } from "./CreateImageLayerDialog"
import { DeleteImageLayerDialog } from "./DeleteImageLayerDialog"

type Props = {
  productModelId: string
  componentId: string
}

export const ImageLayersList = ({ productModelId, componentId }: Props) => {
  const t = useTranslations("ImageLayers")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteLayerId, setDeleteLayerId] = useState<string | null>(null)

  const { data: layers, isLoading, isError } = useImageLayersList(productModelId, componentId)
  const _createMutation = useCreateImageLayer(productModelId, componentId)
  const deleteMutation = useDeleteImageLayer(productModelId, componentId)

  const handleDeleteConfirm = () => {
    if (!deleteLayerId) return
    deleteMutation.mutate(deleteLayerId, {
      onSuccess: () => setDeleteLayerId(null),
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

  const layerList = layers ?? []

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
              className="h-40 rounded-lg"
            />
          ))}
        </div>
      ) : layerList.length === 0 ? (
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
          {layerList
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((layer) => (
              <Card
                key={layer.id}
                className="flex overflow-hidden p-0"
              >
                <div className="relative h-32 w-full shrink-0 bg-muted">
                  <Image
                    src={getImageUrl(layer.imageUrl)}
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex items-center justify-between p-3">
                  <Typography
                    as="span"
                    variant="body-sm"
                    className="text-muted-foreground"
                  >
                    {t("list.zIndex")}: {layer.zIndex}
                  </Typography>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteLayerId(layer.id)}
                  >
                    {t("list.deleteButton")}
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      )}

      <CreateImageLayerDialog
        productModelId={productModelId}
        componentId={componentId}
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <DeleteImageLayerDialog
        isOpen={deleteLayerId !== null}
        onOpenChange={(isOpen) => !isOpen && setDeleteLayerId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
