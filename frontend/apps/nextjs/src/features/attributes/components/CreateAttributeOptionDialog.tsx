"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Typography } from "@workspace/ui/components/typography"

import { ImageUpload } from "@/components/ImageUpload"

import { useCreateAttributeOption } from "../api/attributeOptionQueries"

type Props = {
  productModelId: string
  componentId: string
  attributeId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateAttributeOptionDialog = ({
  productModelId,
  componentId,
  attributeId,
  isOpen,
  onOpenChange,
}: Props) => {
  const t = useTranslations("AttributeOptions")
  const [value, setValue] = useState("")
  const [label, setLabel] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState(0)
  const [formError, setFormError] = useState<string | null>(null)

  const createMutation = useCreateAttributeOption(productModelId, componentId, attributeId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const trimmedValue = value.trim()
    const trimmedLabel = label.trim()
    if (!trimmedValue) {
      setFormError(t("create.errorMessages.valueRequired"))
      return
    }
    if (!trimmedLabel) {
      setFormError(t("create.errorMessages.labelRequired"))
      return
    }
    if (!imageUrl?.trim()) {
      setFormError(t("create.errorMessages.imageRequired"))
      return
    }
    createMutation.mutate(
      {
        value: trimmedValue,
        label: trimmedLabel,
        imageUrl: imageUrl.trim(),
        sortOrder,
      },
      {
        onSuccess: () => {
          setValue("")
          setLabel("")
          setImageUrl(null)
          setSortOrder(0)
          onOpenChange(false)
        },
        onError: (err) => {
          setFormError(err.message ?? t("create.errorMessages.generalError"))
        },
      },
    )
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setValue("")
      setLabel("")
      setImageUrl(null)
      setSortOrder(0)
      setFormError(null)
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
          <div className="space-y-2">
            <Label htmlFor="value">{t("create.valueLabel")}</Label>
            <Input
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("create.valuePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">{t("create.labelLabel")}</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("create.labelPlaceholder")}
            />
          </div>
          <ImageUpload
            value={imageUrl}
            onUploaded={setImageUrl}
            label={t("create.imageLabelRequired")}
          />
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("create.imageHint")}
          </Typography>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">{t("create.sortOrderLabel")}</Label>
            <Input
              id="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              placeholder={t("create.sortOrderPlaceholder")}
            />
          </div>

          {formError && (
            <Typography
              as="p"
              variant="body-sm"
              className="text-destructive"
            >
              {formError}
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
              disabled={createMutation.isPending || !imageUrl?.trim()}
            >
              {createMutation.isPending ? "…" : t("create.submitButton")}
            </Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog>
  )
}
