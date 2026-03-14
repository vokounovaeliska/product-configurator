"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, ImageIcon, ScissorsIcon, TrashIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeOptionDto } from "@/api/attributeTypes"
import { api } from "@/lib/api/restClient"
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

type RowEditState = {
  label: string
  value: string
  sortOrder: number
}

const optionToRowState = (o: AttributeOptionDto): RowEditState => ({
  label: o.label,
  value: o.value,
  sortOrder: o.sortOrder,
})

const buildPatches = (
  original: AttributeOptionDto,
  current: RowEditState,
): { path: "SlashValue" | "SlashLabel" | "SlashSortOrder"; value: unknown; op: "Replace" }[] => {
  const patches: {
    path: "SlashValue" | "SlashLabel" | "SlashSortOrder"
    value: unknown
    op: "Replace"
  }[] = []
  if (current.label !== original.label) {
    patches.push({ path: "SlashLabel", value: current.label, op: "Replace" })
  }
  if (current.value !== original.value) {
    patches.push({ path: "SlashValue", value: current.value, op: "Replace" })
  }
  if (current.sortOrder !== original.sortOrder) {
    patches.push({ path: "SlashSortOrder", value: current.sortOrder, op: "Replace" })
  }
  return patches
}

export const AttributeOptionsList = ({ productModelId, componentId, attributeId }: Props) => {
  const t = useTranslations("AttributeOptions")
  const tEditor = useTranslations("OptionImageEditor")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteOptionId, setDeleteOptionId] = useState<string | null>(null)
  const [editingOption, setEditingOption] = useState<AttributeOptionDto | null>(null)
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ url: string; label: string } | null>(null)
  const [rowEdits, setRowEdits] = useState<Record<string, RowEditState>>({})
  const replacingOptionIdRef = useRef<string | null>(null)
  const replaceImageInputRef = useRef<HTMLInputElement>(null)

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

  const getRowState = (opt: AttributeOptionDto): RowEditState =>
    rowEdits[opt.id] ?? optionToRowState(opt)

  const setRowState = (opt: AttributeOptionDto, updater: (prev: RowEditState) => RowEditState) => {
    setRowEdits((prev) => {
      const current = prev[opt.id] ?? optionToRowState(opt)
      return { ...prev, [opt.id]: updater(current) }
    })
  }

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

  const handleSave = (option: AttributeOptionDto) => {
    const current = getRowState(option)
    const trimmedLabel = current.label.trim()
    const trimmedValue = current.value.trim()
    if (!trimmedLabel || !trimmedValue) return
    const patches = buildPatches(option, { ...current, label: trimmedLabel, value: trimmedValue })
    if (patches.length > 0) {
      updateOption.mutate(
        {
          optionId: option.id,
          patches,
        },
        {
          onSuccess: () => {
            setRowEdits((prev) => {
              const next = { ...prev }
              delete next[option.id]
              return next
            })
          },
        },
      )
    }
  }

  const handleReplaceImageFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      const optionId = replacingOptionIdRef.current
      replacingOptionIdRef.current = null
      e.target.value = ""
      if (!file || !optionId) return

      try {
        const formData = new FormData()
        formData.append("file", file)
        const response = await api
          .post("api/v1/files/upload", { body: formData })
          .json<{ success: boolean; message: string; url: string | null }>()
        if (response.success && response.url) {
          updateOption.mutate({
            optionId,
            patches: [{ path: "SlashImageUrl", value: response.url, op: "Replace" }],
          })
        }
      } catch {
        /* upload failed */
      }
    },
    [updateOption],
  )

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
      <input
        ref={replaceImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleReplaceImageFile}
      />
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
              className="h-12 w-full border-b border-border last:border-0"
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
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[650px] caption-bottom text-sm">
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
                  className="h-9 w-9 px-2"
                  scope="col"
                  title={t("list.replaceImageButton")}
                />
                <th
                  className="h-9 w-9 px-2"
                  scope="col"
                  title={t("list.editorButton")}
                />
                <th
                  className="h-9 px-3"
                  scope="col"
                >
                  {t("list.saveButton")}
                </th>
                <th
                  className="h-9 w-9 px-2"
                  scope="col"
                  title={t("list.deleteButton")}
                />
              </tr>
            </thead>
            <tbody>
              {sortedOptions.map((option, index) => {
                const state = getRowState(option)
                const imageUrl = option.imageUrl ? getImageUrlForDisplay(option.imageUrl) : null
                const isSaving =
                  updateOption.isPending && updateOption.variables?.optionId === option.id

                return (
                  <tr
                    key={option.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-2 py-2 align-middle">
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
                    <td className="px-2 py-2 align-middle">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                        {imageUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                url: imageUrl,
                                label: option.label || option.value,
                              })
                            }
                            className="relative block size-full cursor-zoom-in hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                            title={t("list.imagePreview")}
                          >
                            <Image
                              src={imageUrl}
                              alt={option.label || option.value}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </button>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="size-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Input
                        value={state.label}
                        onChange={(e) =>
                          setRowState(option, (p) => ({ ...p, label: e.target.value }))
                        }
                        className="h-8 min-w-[100px]"
                        placeholder={t("create.labelPlaceholder")}
                        aria-label={t("create.labelLabel")}
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Input
                        value={state.value}
                        onChange={(e) =>
                          setRowState(option, (p) => ({ ...p, value: e.target.value }))
                        }
                        className="h-8 min-w-[80px] bg-muted/30 text-sm text-muted-foreground"
                        placeholder={t("create.valuePlaceholder")}
                        aria-label={t("create.valueLabel")}
                      />
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <Input
                        type="number"
                        min="0"
                        value={state.sortOrder}
                        onChange={(e) =>
                          setRowState(option, (p) => ({
                            ...p,
                            sortOrder: Number.parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className="h-8 w-14 text-right"
                        aria-label={t("list.sortOrder")}
                      />
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          replacingOptionIdRef.current = option.id
                          replaceImageInputRef.current?.click()
                        }}
                        title={t("list.replaceImageButton")}
                      >
                        <ImageIcon className="size-3.5" />
                      </Button>
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setEditingOption(option)
                          setIsImageEditorOpen(true)
                        }}
                        title={t("list.editorButton")}
                      >
                        <ScissorsIcon className="size-3.5" />
                      </Button>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Button
                        size="sm"
                        onClick={() => handleSave(option)}
                        disabled={
                          isSaving ||
                          JSON.stringify(optionToRowState(option)) === JSON.stringify(state) ||
                          !state.label.trim() ||
                          !state.value.trim()
                        }
                      >
                        {isSaving ? "…" : t("list.saveButton")}
                      </Button>
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteOptionId(option.id)}
                        title={t("list.deleteButton")}
                      >
                        <TrashIcon className="size-3.5" />
                      </Button>
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
        defaultSortOrder={
          sortedOptions.length > 0
            ? (sortedOptions[sortedOptions.length - 1]?.sortOrder ?? 0) + 1
            : 0
        }
      />

      <DeleteAttributeOptionDialog
        isOpen={deleteOptionId !== null}
        onOpenChange={(isOpen) => !isOpen && setDeleteOptionId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />

      <Dialog
        open={previewImage !== null}
        onOpenChange={(isOpen) => !isOpen && setPreviewImage(null)}
      >
        <Dialog.Content className="max-w-2xl p-4">
          <Dialog.Content.Header>
            <Dialog.Content.Header.Title>
              {previewImage ? `${t("list.imagePreview")} — ${previewImage.label}` : ""}
            </Dialog.Content.Header.Title>
          </Dialog.Content.Header>
          {previewImage && (
            <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-lg bg-muted">
              <Image
                src={previewImage.url}
                alt={previewImage.label}
                fill
                className="object-contain"
                unoptimized
                sizes="448px"
              />
            </div>
          )}
        </Dialog.Content>
      </Dialog>
    </div>
  )
}
