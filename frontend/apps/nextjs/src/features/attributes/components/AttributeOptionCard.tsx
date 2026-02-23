"use client"

import { useState } from "react"
import { ImageIcon, PencilIcon, TrashIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeOptionDto } from "@/api/attributeTypes"
import { getImageUrlForDisplay } from "@/utils/imageUrl"

import { EditAttributeOptionDialog } from "./EditAttributeOptionDialog"

type Props = {
  option: AttributeOptionDto
  productModelId: string
  componentId: string
  attributeId: string
  onDelete: () => void
}

export const AttributeOptionCard = ({
  option,
  productModelId,
  componentId,
  attributeId,
  onDelete,
}: Props) => {
  const t = useTranslations("AttributeOptions")
  const tEditor = useTranslations("OptionImageEditor")
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false)

  const imageUrl = option.imageUrl ? getImageUrlForDisplay(option.imageUrl) : null

  return (
    <>
      <Card className="flex overflow-hidden p-0">
        <div className="flex flex-1 flex-col">
          <div className="relative h-24 w-32 shrink-0 bg-muted sm:w-full">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="size-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2 p-3">
            <Typography
              as="h3"
              variant="body-md"
              weight="semibold"
              className="line-clamp-2"
              title={option.label}
            >
              {option.label}
            </Typography>
            <Typography
              as="p"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {option.value}
            </Typography>
            <Typography
              as="p"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("list.sortOrder")}: {option.sortOrder}
            </Typography>
            <div className="mt-auto flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
              >
                <PencilIcon className="size-4" />
                <span className="sr-only">{t("list.editButton")}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsImageEditorOpen(true)
                  setIsEditOpen(true)
                }}
              >
                <ImageIcon className="size-4" />
                <span className="sr-only">{t("list.editImageButton")}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
              >
                <TrashIcon className="size-4" />
                <span className="sr-only">{t("list.deleteButton")}</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <EditAttributeOptionDialog
        option={option}
        productModelId={productModelId}
        componentId={componentId}
        attributeId={attributeId}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        isImageEditorOpen={isImageEditorOpen}
        onImageEditorOpenChange={setIsImageEditorOpen}
        t={t}
        tEditor={tEditor}
      />
    </>
  )
}
