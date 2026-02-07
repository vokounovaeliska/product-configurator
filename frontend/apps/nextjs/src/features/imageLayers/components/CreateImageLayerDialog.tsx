"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Typography } from "@workspace/ui/components/typography"

import { ImageUpload } from "@/components/ImageUpload"

import { useCreateImageLayer } from "../api/imageLayerQueries"

type Props = {
  productModelId: string
  componentId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateImageLayerDialog = ({
  productModelId,
  componentId,
  isOpen,
  onOpenChange,
}: Props) => {
  const t = useTranslations("ImageLayers")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [zIndex, setZIndex] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const createMutation = useCreateImageLayer(productModelId, componentId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError(null)
    if (!imageUrl?.trim()) {
      setUploadError(t("create.errorMessages.imageRequired"))
      return
    }
    createMutation.mutate(
      {
        imageUrl: imageUrl.trim(),
        zIndex,
        conditions: [],
      },
      {
        onSuccess: () => {
          setImageUrl(null)
          setZIndex(0)
          onOpenChange(false)
        },
        onError: (err) => {
          setUploadError(err.message ?? t("create.errorMessages.generalError"))
        },
      },
    )
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setImageUrl(null)
      setZIndex(0)
      setUploadError(null)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <Dialog.Content className="max-w-md">
        <Dialog.Content.Header>
          <Dialog.Content.Header.Title>{t("create.title")}</Dialog.Content.Header.Title>
          <Dialog.Content.Header.Description>
            {t("create.description")}
          </Dialog.Content.Header.Description>
        </Dialog.Content.Header>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <ImageUpload
            value={imageUrl}
            onUploaded={setImageUrl}
            onError={setUploadError}
            label={t("create.imageLabel")}
          />

          <div className="space-y-2">
            <Label htmlFor="zIndex">{t("create.zIndexLabel")}</Label>
            <Input
              id="zIndex"
              type="number"
              value={zIndex}
              onChange={(e) => setZIndex(Number(e.target.value) || 0)}
              placeholder={t("create.zIndexPlaceholder")}
            />
          </div>

          {uploadError && (
            <Typography
              as="p"
              variant="body-sm"
              className="text-destructive"
            >
              {uploadError}
            </Typography>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t("create.cancelButton")}
            </Button>
            <Button
              type="submit"
              disabled={!imageUrl?.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Typography
                  as="span"
                  variant="body-sm"
                >
                  …
                </Typography>
              ) : (
                t("create.submitButton")
              )}
            </Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog>
  )
}
