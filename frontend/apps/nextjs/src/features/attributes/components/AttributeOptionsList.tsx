"use client"

import { useMemo, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, ImageIcon, PencilIcon, TrashIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeOptionDto } from "@/api/attributeTypes"
import { getImageUrlForDisplay } from "@/utils/imageUrl"

import {
  useAttributeOptionsList,
  useDeleteAttributeOption,
  useUpdateAttributeOption,
} from "../api/attributeOptionQueries"
import { CreateAttributeOptionDialog } from "./CreateAttributeOptionDialog"
import { DeleteAttributeOptionDialog } from "./DeleteAttributeOptionDialog"
import { EditAttributeOptionDialog } from "./EditAttributeOptionDialog"

type Props = {
  productModelId: string
  componentId: string
  attributeId: string
}

export const AttributeOptionsList = ({ productModelId, componentId, attributeId }: Props) => {
  const t = useTranslations("AttributeOptions")
  const tEditor = useTranslations("OptionImageEditor")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteOptionId, setDeleteOptionId] = useState<string | null>(null)
  const [editingOption, setEditingOption] = useState<AttributeOptionDto | null>(null)
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false)

  const {
    data: options,
    isLoading,
    isError,
  } = useAttributeOptionsList(productModelId, componentId, attributeId)
  const deleteMutation = useDeleteAttributeOption(productModelId, componentId, attributeId)
  const updateOption = useUpdateAttributeOption(productModelId, componentId, attributeId)

  const sortedOptions = useMemo(
    () => [...(options ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [options],
  )

  const handleMoveOptionUp = (option: AttributeOptionDto) => {
    const idx = sortedOptions.findIndex((o) => o.id === option.id)
    if (idx <= 0) return
    const prev = sortedOptions[idx - 1]
    if (!prev || updateOption.isPending) return
    updateOption.mutate({
      optionId: option.id,
      patches: [{ path: "SlashSortOrder", value: prev.sortOrder, op: "Replace" }],
    })
    updateOption.mutate({
      optionId: prev.id,
      patches: [{ path: "SlashSortOrder", value: option.sortOrder, op: "Replace" }],
    })
  }

  const handleMoveOptionDown = (option: AttributeOptionDto) => {
    const idx = sortedOptions.findIndex((o) => o.id === option.id)
    if (idx < 0 || idx >= sortedOptions.length - 1) return
    const next = sortedOptions[idx + 1]
    if (!next || updateOption.isPending) return
    updateOption.mutate({
      optionId: option.id,
      patches: [{ path: "SlashSortOrder", value: next.sortOrder, op: "Replace" }],
    })
    updateOption.mutate({
      optionId: next.id,
      patches: [{ path: "SlashSortOrder", value: option.sortOrder, op: "Replace" }],
    })
  }

  const handleDeleteConfirm = () => {
    if (!deleteOptionId) return
    deleteMutation.mutate(deleteOptionId, {
      onSuccess: () => setDeleteOptionId(null),
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
        <div className="rounded-lg border">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-10 w-full border-b border-border last:border-0"
            />
          ))}
        </div>
      ) : sortedOptions.length === 0 ? (
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
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th
                  className="h-9 w-10 px-2"
                  scope="col"
                />
                <th
                  className="h-9 w-14 px-2"
                  scope="col"
                />
                <th
                  className="h-9 px-3 text-left font-medium"
                  scope="col"
                >
                  {t("create.labelLabel")}
                </th>
                <th
                  className="h-9 px-3 text-left font-medium"
                  scope="col"
                >
                  {t("create.valueLabel")}
                </th>
                <th
                  className="h-9 w-16 px-2 text-right font-medium tabular-nums"
                  scope="col"
                >
                  {t("list.sortOrder")}
                </th>
                <th
                  className="h-9 w-28 px-2 text-right"
                  scope="col"
                />
              </tr>
            </thead>
            <tbody>
              {sortedOptions.map((option, index) => {
                const imageUrl = option.imageUrl ? getImageUrlForDisplay(option.imageUrl) : null
                return (
                  <tr
                    key={option.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-2 py-1 align-middle">
                      <div className="flex flex-col gap-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveOptionUp(option)}
                          title={t("list.moveUp")}
                          disabled={index === 0}
                        >
                          <ArrowUpIcon className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveOptionDown(option)}
                          title={t("list.moveDown")}
                          disabled={index === sortedOptions.length - 1}
                        >
                          <ArrowDownIcon className="size-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-2 py-1 align-middle">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
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
                            <ImageIcon className="size-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-1 align-middle font-medium">{option.label}</td>
                    <td className="px-3 py-1 align-middle text-muted-foreground">{option.value}</td>
                    <td className="px-2 py-1 text-right align-middle text-muted-foreground tabular-nums">
                      {option.sortOrder}
                    </td>
                    <td className="px-2 py-1 align-middle">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setIsImageEditorOpen(true)
                            setEditingOption(option)
                          }}
                          title={t("list.editImageButton")}
                        >
                          <ImageIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setIsImageEditorOpen(false)
                            setEditingOption(option)
                          }}
                          title={t("list.editButton")}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteOptionId(option.id)}
                          title={t("list.deleteButton")}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingOption && (
        <EditAttributeOptionDialog
          option={editingOption}
          productModelId={productModelId}
          componentId={componentId}
          attributeId={attributeId}
          isOpen={true}
          onOpenChange={(isOpen) => !isOpen && setEditingOption(null)}
          isImageEditorOpen={isImageEditorOpen}
          onImageEditorOpenChange={setIsImageEditorOpen}
          t={t}
          tEditor={tEditor}
        />
      )}

      <CreateAttributeOptionDialog
        productModelId={productModelId}
        componentId={componentId}
        attributeId={attributeId}
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <DeleteAttributeOptionDialog
        isOpen={deleteOptionId !== null}
        onOpenChange={(isOpen) => !isOpen && setDeleteOptionId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
