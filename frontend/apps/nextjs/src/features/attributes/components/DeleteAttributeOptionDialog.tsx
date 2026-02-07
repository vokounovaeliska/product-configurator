"use client"

import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting?: boolean
}

export const DeleteAttributeOptionDialog = ({
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: Props) => {
  const t = useTranslations("AttributeOptions")

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

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t("delete.cancelButton")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "…" : t("delete.confirmButton")}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
