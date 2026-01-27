"use client"

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

import {
  getProductModelFormSchema,
  type ProductModelFormSchema,
} from "@/features/productModels/schemas/productModelFormSchema"

import { useCreateProductModel } from "../api/productModelQueries"

type Props = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const CreateProductModelDialog = ({ isOpen, onOpenChange }: Props) => {
  const t = useTranslations("ProductModels")
  const createProductModel = useCreateProductModel()

  const productModelFormSchema = getProductModelFormSchema(t)

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
    resolver: zodResolver(productModelFormSchema),
  })

  const onSubmit = async (values: ProductModelFormSchema) => {
    try {
      await createProductModel.mutateAsync({
        name: values.name,
        description: values.description ?? null,
      })

      onOpenChange(false)
      form.reset()
    } catch (err) {
      // Error is handled by react-query, but we can show a message if needed
      console.error("Failed to create product model:", err)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <Dialog.Content>
        <Dialog.Content.Header>
          <Dialog.Content.Header.Title>{t("create.title")}</Dialog.Content.Header.Title>
          <Dialog.Content.Header.Description>
            {t("create.description")}
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
                  <FormLabel>{t("create.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("create.namePlaceholder")}
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
                  <FormLabel>{t("create.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("create.descriptionPlaceholder")}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {createProductModel.isError && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                {createProductModel.error instanceof Error
                  ? createProductModel.error.message
                  : t("create.errorMessages.generalError")}
              </div>
            )}

            <Dialog.Content.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createProductModel.isPending}
              >
                {t("create.cancelButton")}
              </Button>
              <Button
                type="submit"
                disabled={createProductModel.isPending}
              >
                {t("create.submitButton")}
              </Button>
            </Dialog.Content.Footer>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  )
}
