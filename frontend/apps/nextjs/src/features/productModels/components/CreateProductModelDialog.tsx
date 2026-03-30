"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { FileUpIcon } from "lucide-react"
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
import { Typography } from "@workspace/ui/components/typography"

import { shouldShowManualEmptyProductModelOption } from "@/config/featureFlags"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

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
      <Dialog.Content className="grid max-h-[min(90vh,40rem)] min-w-0 gap-4 overflow-x-hidden overflow-y-auto">
        <Dialog.Content.Header className="min-w-0 shrink-0">
          <Dialog.Content.Header.Title>{t("create.title")}</Dialog.Content.Header.Title>
          <Dialog.Content.Header.Description>
            {t("create.description")}
          </Dialog.Content.Header.Description>
        </Dialog.Content.Header>

        <div className="min-w-0 space-y-3">
          <Button
            asChild
            className="h-auto w-full max-w-full min-w-0 flex-col gap-1 py-4"
          >
            <Link
              href={ROUTES.setupImportSketchup}
              onClick={() => onOpenChange(false)}
              className="inline-flex max-w-full min-w-0 flex-col items-stretch gap-1.5 px-2 py-0 text-center break-words"
            >
              <span className="flex min-w-0 items-center justify-center gap-2 text-base font-semibold">
                <FileUpIcon
                  className="size-5 shrink-0"
                  aria-hidden
                />
                <span className="min-w-0">{t("create.importSketchupButton")}</span>
              </span>
              <span className="text-xs font-normal text-pretty text-muted-foreground">
                {t("create.importSketchupHint")}
              </span>
            </Link>
          </Button>

          {shouldShowManualEmptyProductModelOption && (
            <>
              <div
                className="relative py-1"
                role="separator"
              >
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t("create.orDivider")}
                  </span>
                </div>
              </div>

              <Typography
                as="p"
                variant="body-sm"
                weight="medium"
                className="text-muted-foreground"
              >
                {t("create.manualSectionTitle")}
              </Typography>
            </>
          )}
        </div>

        {shouldShowManualEmptyProductModelOption ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-4 min-w-0 space-y-4"
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

              <Dialog.Content.Footer className="min-w-0 shrink-0 gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createProductModel.isPending}
                  className="w-full min-w-0 sm:w-auto"
                >
                  {t("create.cancelButton")}
                </Button>
                <Button
                  type="submit"
                  disabled={createProductModel.isPending}
                  className="w-full min-w-0 sm:w-auto"
                >
                  {t("create.submitButton")}
                </Button>
              </Dialog.Content.Footer>
            </form>
          </Form>
        ) : (
          <Dialog.Content.Footer className="min-w-0 shrink-0 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full min-w-0 sm:w-auto"
            >
              {t("create.cancelButton")}
            </Button>
          </Dialog.Content.Footer>
        )}
      </Dialog.Content>
    </Dialog>
  )
}
