"use client"

import { useState } from "react"
import { PencilIcon, TrashIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"

import type { ComponentDto } from "@/api/componentTypes"

import { DeleteComponentDialog } from "./DeleteComponentDialog"
import { EditComponentDialog } from "./EditComponentDialog"

type Props = {
  component: ComponentDto
  productModelId: string
}

export const ComponentCard = ({ component, productModelId }: Props) => {
  const t = useTranslations("Components")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <Typography
                as="h3"
                variant="display-md"
                weight="semibold"
                className="line-clamp-2"
              >
                {component.label}
              </Typography>
              <Typography
                as="p"
                variant="body-sm"
                className="mt-1 text-muted-foreground"
              >
                {component.code}
              </Typography>
            </div>
          </div>

          {component.description && (
            <Typography
              as="p"
              variant="body-md"
              className="line-clamp-3 text-muted-foreground"
            >
              {component.description}
            </Typography>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <Typography
              as="p"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("card.sortOrder")}: {component.sortOrder}
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <PencilIcon className="size-4" />
                <span className="sr-only">{t("card.editButton")}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <TrashIcon className="size-4" />
                <span className="sr-only">{t("card.deleteButton")}</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <EditComponentDialog
        component={component}
        productModelId={productModelId}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <DeleteComponentDialog
        component={component}
        productModelId={productModelId}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  )
}
