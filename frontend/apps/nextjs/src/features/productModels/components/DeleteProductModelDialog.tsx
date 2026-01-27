"use client"

import { AlertTriangleIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import { Typography } from "@workspace/ui/components/typography"

import type { ProductModelDto } from "@/api/productModelTypes"

import { useDeleteProductModel } from "../api/productModelQueries"

type Props = {
  productModel: ProductModelDto
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const DeleteProductModelDialog = ({ productModel, isOpen, onOpenChange }: Props) => {
  const t = useTranslations("ProductModels")
  const deleteProductModel = useDeleteProductModel()

  const handleDelete = async () => {
    try {
      await deleteProductModel.mutateAsync(productModel.id)
      onOpenChange(false)
    } catch (err) {
      // Error is handled by react-query, but we can show a message if needed
      console.error("Failed to delete product model:", err)
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
          <div className="flex gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <AlertTriangleIcon className="size-5 shrink-0 text-destructive" />
            <div className="space-y-2">
              <Typography
                as="p"
                variant="body-md"
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
                {t("delete.warningMessage", { name: productModel.name })}
              </Typography>
            </div>
          </div>

          {deleteProductModel.isError && (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
              {deleteProductModel.error instanceof Error
                ? deleteProductModel.error.message
                : t("delete.errorMessages.generalError")}
            </div>
          )}

          <Dialog.Content.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={deleteProductModel.isPending}
            >
              {t("delete.cancelButton")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProductModel.isPending}
            >
              {t("delete.confirmButton")}
            </Button>
          </Dialog.Content.Footer>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
