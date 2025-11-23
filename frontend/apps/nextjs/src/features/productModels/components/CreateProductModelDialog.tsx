"use client"

import { useState } from "react"
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

type Props = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const CreateProductModelDialog = ({ isOpen, onOpenChange }: Props) => {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const t = useTranslations("ProductModels")

  const productModelFormSchema = getProductModelFormSchema(t)

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
    resolver: zodResolver(productModelFormSchema),
  })

  const onSubmit = (_values: ProductModelFormSchema) => {
    setError(null)
    setIsSubmitting(true)

    try {
      // TODO: Call API to create product model
      // await api.post("product-models", { json: values })

      // For now, just close the dialog
      onOpenChange(false)
      form.reset()
      // TODO: Refresh the product models list
    } catch (err) {
      setError(err instanceof Error ? err.message : t("create.errorMessages.generalError"))
    } finally {
      setIsSubmitting(false)
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

            {error && <div className="rounded-lg bg-red-50 p-4 text-red-800">{error}</div>}

            <Dialog.Content.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("create.cancelButton")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
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
