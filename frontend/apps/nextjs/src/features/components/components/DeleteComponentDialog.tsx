"use client"

import { AlertTriangleIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import { Typography } from "@workspace/ui/components/typography"

import type { ComponentDto } from "@/api/componentTypes"

import { useDeleteComponent } from "../api/componentQueries"

type Props = {
  component: ComponentDto
  productModelId: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const DeleteComponentDialog = ({
  component,
  productModelId,
  isOpen,
  onOpenChange,
}: Props) => {
  const t = useTranslations("Components")
  const deleteComponent = useDeleteComponent(productModelId)

  const handleDelete = async () => {
    try {
      await deleteComponent.mutateAsync(component.id)
      onOpenChange(false)
    } catch (err) {
      console.error("Failed to delete component:", err)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <Dialog.Content>
        <Dialog.Content.Header>
          <Dialog.Content.Header.Title>{t("delete.title")}</Dialog.Content.Header.Title>
          <Dialog.Content.Header.Description>
            {t("delete.description")}
          </Dialog.Content.Header.Description>
        </Dialog.Content.Header>

        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="space-y-1">
              <Typography
                as="p"
                variant="body-sm"
                weight="semibold"
                className="text-destructive"
              >
                {t("delete.warningTitle")}
              </Typography>
              <Typography
                as="p"
                variant="body-sm"
                className="text-destructive/90"
              >
                {t("delete.warningMessage", { name: component.label })}
              </Typography>
            </div>
          </div>

          {deleteComponent.isError && (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
              {deleteComponent.error instanceof Error
                ? deleteComponent.error.message
                : t("delete.errorMessages.generalError")}
            </div>
          )}

          <Dialog.Content.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={deleteComponent.isPending}
            >
              {t("delete.cancelButton")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteComponent.isPending}
            >
              {t("delete.confirmButton")}
            </Button>
          </Dialog.Content.Footer>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
