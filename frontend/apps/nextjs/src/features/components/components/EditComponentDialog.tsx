"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

import type { ComponentDto } from "@/api/componentTypes"

import { useUpdateComponent } from "../api/componentQueries"
import { getComponentFormSchema, type ComponentFormSchema } from "../schemas/componentFormSchema"

type Props = {
  component: ComponentDto
  productModelId: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const EditComponentDialog = ({ component, productModelId, isOpen, onOpenChange }: Props) => {
  const t = useTranslations("Components")
  const updateComponent = useUpdateComponent(productModelId)

  const componentFormSchema = getComponentFormSchema(t)

  const form = useForm({
    defaultValues: {
      code: component.code,
      label: component.label,
      description: component.description ?? "",
      sortOrder: component.sortOrder,
      imageZIndex: component.imageZIndex,
    },
    resolver: zodResolver(componentFormSchema),
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        code: component.code,
        label: component.label,
        description: component.description ?? "",
        sortOrder: component.sortOrder,
        imageZIndex: component.imageZIndex,
      })
    }
  }, [component, isOpen, form])

  const onSubmit = async (values: ComponentFormSchema) => {
    try {
      const patches = []

      if (values.code !== component.code) {
        patches.push({ path: "SlashCode" as const, op: "Replace" as const, value: values.code })
      }
      if (values.label !== component.label) {
        patches.push({ path: "SlashLabel" as const, op: "Replace" as const, value: values.label })
      }
      if (values.description !== component.description) {
        patches.push({
          path: "SlashDescription" as const,
          op: "Replace" as const,
          value: values.description ?? null,
        })
      }
      if (values.sortOrder !== component.sortOrder) {
        patches.push({
          path: "SlashSortOrder" as const,
          op: "Replace" as const,
          value: values.sortOrder ?? 0,
        })
      }
      if (values.imageZIndex !== component.imageZIndex) {
        patches.push({
          path: "SlashImageZIndex" as const,
          op: "Replace" as const,
          value: values.imageZIndex ?? 0,
        })
      }

      if (patches.length > 0) {
        await updateComponent.mutateAsync({
          componentId: component.id,
          patches,
        })
      }

      onOpenChange(false)
    } catch (err) {
      console.error("Failed to update component:", err)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <Dialog.Content>
        <Dialog.Content.Header>
          <Dialog.Content.Header.Title>{t("edit.title")}</Dialog.Content.Header.Title>
          <Dialog.Content.Header.Description>
            {t("edit.description")}
          </Dialog.Content.Header.Description>
        </Dialog.Content.Header>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("edit.code")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("edit.codePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("edit.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("edit.labelPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("edit.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("edit.descriptionPlaceholder")}
                      rows={4}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("edit.sortOrder")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(Number.parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageZIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("edit.imageZIndex")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder={t("edit.imageZIndexPlaceholder")}
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(Math.max(0, Number.parseInt(e.target.value, 10) || 0))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {updateComponent.isError && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                {updateComponent.error instanceof Error
                  ? updateComponent.error.message
                  : t("edit.errorMessages.generalError")}
              </div>
            )}

            <Dialog.Content.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateComponent.isPending}
              >
                {t("edit.cancelButton")}
              </Button>
              <Button
                type="submit"
                disabled={updateComponent.isPending}
              >
                {t("edit.submitButton")}
              </Button>
            </Dialog.Content.Footer>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  )
}
