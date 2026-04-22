"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeOptionDto } from "@/api/attributeTypes"
import { ImageUpload } from "@/components/ImageUpload"
import type { TFunction } from "@/types/tFunction"
import { getEditorImageUrl } from "@/utils/imageUrl"

import { useUpdateAttributeOption } from "../api/attributeOptionQueries"
import { OptionImageEditor } from "./OptionImageEditor/OptionImageEditor"

type Props = {
  option: AttributeOptionDto
  productModelId: string
  componentId: string
  attributeId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isImageEditorOpen: boolean
  onImageEditorOpenChange: (open: boolean) => void

  t: TFunction<"AttributeOptions">
  tEditor: TFunction<"OptionImageEditor">
}

export const EditAttributeOptionDialog = ({
  option,
  productModelId,
  componentId,
  attributeId,
  isOpen,
  onOpenChange,
  isImageEditorOpen,
  onImageEditorOpenChange,
  t,
  tEditor,
}: Props) => {
  const [value, setValue] = useState(option.value)
  const [label, setLabel] = useState(option.label)
  const [imageUrl, setImageUrl] = useState<string | null>(option.imageUrl)
  const [sortOrder, setSortOrder] = useState(option.sortOrder)
  const [editorSourceUrl, setEditorSourceUrl] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const updateMutation = useUpdateAttributeOption(productModelId, componentId, attributeId)

  const sourceForEditor = option.imageUrl ?? editorSourceUrl
  const sourceImageUrlForEditor = sourceForEditor ? getEditorImageUrl(sourceForEditor) : ""

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const trimmedValue = value.trim()
    const trimmedLabel = label.trim()
    if (!trimmedValue || !trimmedLabel) {
      setFormError(t("create.errorMessages.labelRequired"))
      return
    }
    updateMutation.mutate(
      {
        optionId: option.id,
        patches: [
          { path: "SlashValue", value: trimmedValue, op: "Replace" },
          { path: "SlashLabel", value: trimmedLabel, op: "Replace" },
          { path: "SlashImageUrl", value: imageUrl ?? null, op: "Replace" },
          { path: "SlashSortOrder", value: sortOrder, op: "Replace" },
        ],
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => {
          setFormError(err.message ?? t("create.errorMessages.generalError"))
        },
      },
    )
  }

  const handleImageEditorComplete = (newImageUrl: string) => {
    updateMutation.mutate(
      {
        optionId: option.id,
        patches: [{ path: "SlashImageUrl", value: newImageUrl, op: "Replace" }],
      },
      {
        onSuccess: () => {
          setImageUrl(newImageUrl)
          onImageEditorOpenChange(false)
          onOpenChange(false)
        },
      },
    )
  }

  const isShowImageEditorFlow = isOpen && isImageEditorOpen
  const isShowEditor = isShowImageEditorFlow && sourceImageUrlForEditor.length > 0

  return (
    <>
      <Dialog
        open={isOpen && !isImageEditorOpen}
        onOpenChange={onOpenChange}
      >
        <Dialog.Content className="max-w-md">
          <Dialog.Content.Header>
            <Dialog.Content.Header.Title>{t("edit.title")}</Dialog.Content.Header.Title>
            <Dialog.Content.Header.Description>
              {t("edit.description")}
            </Dialog.Content.Header.Description>
          </Dialog.Content.Header>

          <form
            onSubmit={handleSubmitForm}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-label">{t("edit.labelLabel")}</Label>
              <Input
                id="edit-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <ImageUpload
              value={imageUrl}
              onUploaded={setImageUrl}
              label={t("edit.imageLabel")}
            />
            <div className="space-y-2">
              <Label htmlFor="edit-sortOrder">{t("edit.sortOrderLabel")}</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="edit-value"
                className="text-sm font-normal text-muted-foreground"
              >
                {t("edit.valueLabel")}
              </Label>
              <Input
                id="edit-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="bg-muted/30 text-sm text-muted-foreground"
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
                onClick={() => onOpenChange(false)}
              >
                {t("edit.cancelButton")}
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "…" : t("edit.submitButton")}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog>

      {isShowImageEditorFlow && !isShowEditor && (
        <Dialog
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              onImageEditorOpenChange(false)
              onOpenChange(false)
            }
          }}
        >
          <Dialog.Content className="max-w-md">
            <Dialog.Content.Header>
              <Dialog.Content.Header.Title>
                {t("edit.editImageWithEditor")}
              </Dialog.Content.Header.Title>
              <Dialog.Content.Header.Description>
                {t("edit.editImageSourceHint")}
              </Dialog.Content.Header.Description>
            </Dialog.Content.Header>
            <div className="space-y-4">
              <ImageUpload
                value={editorSourceUrl ?? option.imageUrl}
                onUploaded={setEditorSourceUrl}
                label="Source photo"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    onImageEditorOpenChange(false)
                    onOpenChange(false)
                  }}
                >
                  {t("edit.cancelButton")}
                </Button>
                <Button
                  disabled={!editorSourceUrl && !option.imageUrl}
                  onClick={() => {
                    if (editorSourceUrl || option.imageUrl) {
                      onImageEditorOpenChange(true)
                    }
                  }}
                >
                  {t("edit.openEditor")}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog>
      )}

      {isShowEditor && (
        <OptionImageEditor
          sourceImageUrl={sourceImageUrlForEditor}
          isOpen={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              onImageEditorOpenChange(false)
              onOpenChange(false)
            }
          }}
          onComplete={handleImageEditorComplete}
          onError={(_msg) => updateMutation.reset()}
          t={tEditor}
        />
      )}
    </>
  )
}
