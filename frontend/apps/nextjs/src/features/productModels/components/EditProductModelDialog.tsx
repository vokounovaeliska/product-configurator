"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
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
import { Select } from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"

import type { ProductModelDto } from "@/api/productModelTypes"

import {
  getProductModelEditFormSchema,
  type ProductModelEditFormSchema,
} from "@/features/productModels/schemas/productModelFormSchema"

import { useUpdateProductModel } from "../api/productModelQueries"

type Props = {
  productModel: ProductModelDto
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const CURRENCIES = ["CZK", "EUR", "USD", "GBP"] as const

export const EditProductModelDialog = ({ productModel, isOpen, onOpenChange }: Props) => {
  const t = useTranslations("ProductModels")
  const updateProductModel = useUpdateProductModel()

  const productModelEditFormSchema = getProductModelEditFormSchema(t)

  const form = useForm<ProductModelEditFormSchema>({
    defaultValues: {
      name: productModel.name,
      description: productModel.description ?? "",
      price: productModel.price,
      currency: productModel.currency,
      isActive: productModel.isActive,
    },
    resolver: zodResolver(productModelEditFormSchema),
  })

  // Reset form when productModel changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: productModel.name,
        description: productModel.description ?? "",
        price: productModel.price,
        currency: productModel.currency,
        isActive: productModel.isActive,
      })
    }
  }, [productModel, isOpen, form])

  const onSubmit = async (values: ProductModelEditFormSchema) => {
    try {
      const patches = []

      if (values.name !== productModel.name) {
        patches.push({
          path: "SlashName" as const,
          value: values.name,
          op: "Replace" as const,
        })
      }

      if (values.description !== (productModel.description ?? "")) {
        patches.push({
          path: "SlashDescription" as const,
          value: values.description ?? null,
          op: "Replace" as const,
        })
      }

      if (values.price !== productModel.price) {
        patches.push({
          path: "SlashPrice" as const,
          value: values.price,
          op: "Replace" as const,
        })
      }

      if (values.currency !== productModel.currency) {
        patches.push({
          path: "SlashCurrency" as const,
          value: values.currency,
          op: "Replace" as const,
        })
      }

      if (values.isActive !== productModel.isActive) {
        patches.push({
          path: "SlashIsActive" as const,
          value: values.isActive,
          op: "Replace" as const,
        })
      }

      if (patches.length > 0) {
        await updateProductModel.mutateAsync({
          id: productModel.id,
          patches,
        })

        onOpenChange(false)
      } else {
        // No changes, just close
        onOpenChange(false)
      }
    } catch (err) {
      // Error is handled by react-query, but we can show a message if needed
      console.error("Failed to update product model:", err)
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("edit.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("edit.namePlaceholder")}
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("edit.price")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t("edit.pricePlaceholder")}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("edit.currency")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <Select.Trigger>
                          <Select.Trigger.Value placeholder={t("edit.currencyPlaceholder")} />
                        </Select.Trigger>
                      </FormControl>
                      <Select.Content>
                        {CURRENCIES.map((currency) => (
                          <Select.Content.Item
                            key={currency}
                            value={currency}
                          >
                            {currency}
                          </Select.Content.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t("edit.isActive")}</FormLabel>
                    <p className="text-sm text-muted-foreground">{t("edit.isActiveDescription")}</p>
                  </div>
                </FormItem>
              )}
            />

            {updateProductModel.isError && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                {updateProductModel.error instanceof Error
                  ? updateProductModel.error.message
                  : t("edit.errorMessages.generalError")}
              </div>
            )}

            <Dialog.Content.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateProductModel.isPending}
              >
                {t("edit.cancelButton")}
              </Button>
              <Button
                type="submit"
                disabled={updateProductModel.isPending}
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
