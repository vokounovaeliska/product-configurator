"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { useDeleteCustomerRequest } from "../api/customerRequestQueries"

type Props = {
  requestId: string

  onDeleted?: () => void

  variant?: "icon" | "button"
  className?: string
}

export function CustomerRequestDeleteControl({
  requestId,
  onDeleted,
  variant = "button",
  className,
}: Props) {
  const t = useTranslations("Setup.customerRequests")
  const [isOpen, setIsOpen] = useState(false)
  const deleteRequest = useDeleteCustomerRequest()

  const handleConfirm = () => {
    deleteRequest.reset()
    deleteRequest.mutate(requestId, {
      onSuccess: () => {
        setIsOpen(false)
        onDeleted?.()
      },
    })
  }

  return (
    <>
      {variant === "icon" ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("size-9 shrink-0 text-muted-foreground hover:text-destructive", className)}
          aria-label={t("deleteRequest")}
          disabled={deleteRequest.isPending}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(true)
          }}
        >
          <Trash2Icon className="size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className={cn(
            "border-destructive/40 text-destructive hover:bg-destructive/10",
            className,
          )}
          disabled={deleteRequest.isPending}
          onClick={() => setIsOpen(true)}
        >
          <Trash2Icon className="mr-1.5 size-4" />
          {t("deleteRequest")}
        </Button>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(isNextOpen) => {
          if (!isNextOpen) deleteRequest.reset()
          setIsOpen(isNextOpen)
        }}
      >
        <Dialog.Content className="gap-0 sm:max-w-md">
          <Dialog.Content.Header className="pr-10">
            <Dialog.Content.Header.Title>{t("deleteConfirmTitle")}</Dialog.Content.Header.Title>
            <Dialog.Content.Header.Description>
              {t("deleteConfirmDescription")}
            </Dialog.Content.Header.Description>
          </Dialog.Content.Header>
          {deleteRequest.isError && (
            <Typography
              as="p"
              variant="body-sm"
              className="mt-3 text-destructive"
            >
              {t("deleteError")}
            </Typography>
          )}
          <Dialog.Content.Footer className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                deleteRequest.reset()
                setIsOpen(false)
              }}
              disabled={deleteRequest.isPending}
            >
              {t("deleteCancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteRequest.isPending}
              onClick={handleConfirm}
            >
              {deleteRequest.isPending ? t("deleteInProgress") : t("deleteConfirm")}
            </Button>
          </Dialog.Content.Footer>
        </Dialog.Content>
      </Dialog>
    </>
  )
}
