"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircleIcon, CheckCircleIcon } from "lucide-react"
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
import { Textarea } from "@workspace/ui/components/textarea"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import type { ProductModelEmbedDto } from "@/api/embedTypes"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { useCreateCustomerRequest } from "@/features/embed/api/embedQueries"
import { capture2DSnapshot } from "@/features/embed/utils/capture2DSnapshot"

import {
  getRequestQuoteFormSchema,
  type RequestQuoteFormSchema,
} from "../schemas/requestQuoteFormSchema"

type Configuration = {
  selectedOptionsByComponent: Record<string, Record<string, unknown>>
  selectedOtherValuesByComponent: Record<string, Record<string, number | boolean>>
}

type PreviewLayer = { id: string; imageUrl: string; zIndex: number }

type Props = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  product: ProductModelEmbedDto
  totalPrice: number
  configuration: Configuration
  snapshotSelector?: string
  /** For 2D products: layers to composite into snapshot when no 3D canvas exists */
  previewLayers?: PreviewLayer[]
  /** For 3D products: ref to capture at fixed angle (takes precedence over snapshotSelector) */
  capture3DRef?: React.RefObject<(() => Promise<string | null>) | null>
}

function capture3DSnapshot(selector: string): string | null {
  if (typeof document === "undefined") return null
  const el = document.querySelector(selector)
  if (!el) return null
  const canvas = el.querySelector("canvas")
  if (!canvas) return null
  try {
    return canvas.toDataURL("image/png")
  } catch {
    return null
  }
}

export const RequestQuoteDialog = ({
  isOpen,
  onOpenChange,
  product,
  totalPrice,
  configuration,
  snapshotSelector = "[data-embed-preview]",
  previewLayers,
  capture3DRef,
}: Props) => {
  const t = useTranslations("Embed")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const createRequest = useCreateCustomerRequest()

  const requestQuoteFormSchema = getRequestQuoteFormSchema(t)

  const form = useForm<RequestQuoteFormSchema>({
    resolver: zodResolver(requestQuoteFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerNote: "",
      acceptDataProcessing: false,
    },
  })

  const handleOpenChange = (isNextOpen: boolean) => {
    if (!isNextOpen) {
      form.reset()
      setSubmitError(null)
      setIsSuccess(false)
    }
    onOpenChange(isNextOpen)
  }

  const onSubmit = async (values: RequestQuoteFormSchema) => {
    setSubmitError(null)
    let snapshot: string | null = null
    if (capture3DRef?.current) {
      snapshot = await capture3DRef.current()
    } else if (snapshotSelector) {
      snapshot = capture3DSnapshot(snapshotSelector)
    }
    if (!snapshot && previewLayers && previewLayers.length > 0) {
      snapshot = await capture2DSnapshot(previewLayers)
    }

    try {
      await createRequest.mutateAsync({
        customerName: values.customerName?.trim() ?? null,
        customerEmail: values.customerEmail.trim(),
        customerPhone: values.customerPhone?.trim() ?? null,
        customerNote: values.customerNote?.trim() ?? null,
        productModelId: product.id,
        productModelName: product.name,
        productModelDescription: product.description ?? undefined,
        currency: product.currency,
        totalPrice,
        configurationJson: configuration,
        pricingBreakdownJson: undefined,
        snapshotImageBase64: snapshot,
      })
      setIsSuccess(true)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : t("requestQuoteDialog.errorMessages.generalError"),
      )
    }
  }

  if (isSuccess) {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={handleOpenChange}
      >
        <Dialog.Content className="max-h-[85dvh] gap-3 overflow-y-auto p-4 sm:max-w-[20rem]">
          <Dialog.Content.Header className="gap-2 space-y-0">
            <div className="flex items-start gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircleIcon className="size-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 space-y-1">
                <Dialog.Content.Header.Title className="text-base leading-snug">
                  {t("requestQuoteDialog.success.title")}
                </Dialog.Content.Header.Title>
                <Dialog.Content.Header.Description className="text-xs leading-snug">
                  {t("requestQuoteDialog.success.description")}
                </Dialog.Content.Header.Description>
              </div>
            </div>
          </Dialog.Content.Header>
          <Dialog.Content.Footer className="gap-2 pt-0">
            <Button
              onClick={() => handleOpenChange(false)}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              {t("requestQuoteDialog.success.close")}
            </Button>
          </Dialog.Content.Footer>
        </Dialog.Content>
      </Dialog>
    )
  }

  const compactFieldClass = "gap-1.5 space-y-0"
  const compactLabelClass = "text-xs font-medium leading-none"
  const compactInputClass = "h-8 px-2.5 text-sm"

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <Dialog.Content className="gap-3 p-4 sm:max-w-md">
        <Dialog.Content.Header className="gap-1 space-y-0">
          <Dialog.Content.Header.Title className="text-base leading-tight">
            {t("requestQuoteDialog.title")}
          </Dialog.Content.Header.Title>
          <Dialog.Content.Header.Description className="text-xs leading-snug">
            {t("requestQuoteDialog.description")}
          </Dialog.Content.Header.Description>
        </Dialog.Content.Header>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3"
          >
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem className={compactFieldClass}>
                  <FormLabel className={compactLabelClass}>
                    {t("requestQuoteDialog.fields.name")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("requestQuoteDialog.fields.namePlaceholder")}
                      className={compactInputClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem className={compactFieldClass}>
                  <FormLabel className={compactLabelClass}>
                    {t("requestQuoteDialog.fields.email")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("requestQuoteDialog.fields.emailPlaceholder")}
                      className={compactInputClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem className={compactFieldClass}>
                  <FormLabel className={compactLabelClass}>
                    {t("requestQuoteDialog.fields.phone")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder={t("requestQuoteDialog.fields.phonePlaceholder")}
                      className={compactInputClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerNote"
              render={({ field }) => (
                <FormItem className={compactFieldClass}>
                  <FormLabel className={compactLabelClass}>
                    {t("requestQuoteDialog.fields.message")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("requestQuoteDialog.fields.messagePlaceholder")}
                      rows={3}
                      className="min-h-[4.5rem] resize-none text-sm leading-snug"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptDataProcessing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-2 space-y-0 rounded-md border border-border/70 bg-muted/30 p-2.5 dark:bg-muted/20">
                  <FormControl>
                    <Checkbox
                      className="mt-0.5"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="min-w-0 flex-1">
                    <FormLabel className="!mt-0 !block w-full min-w-0 cursor-pointer text-left text-xs leading-snug !font-normal text-pretty text-foreground">
                      {t.rich("requestQuoteDialog.dataProcessingConsentLabel", {
                        privacy: (chunks) => (
                          <Link
                            href={ROUTES.privacy}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline font-medium text-primary underline decoration-primary/60 underline-offset-2"
                          >
                            {chunks}
                          </Link>
                        ),
                      })}
                    </FormLabel>
                    <FormMessage className="text-xs" />
                  </div>
                </FormItem>
              )}
            />

            {submitError && (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5",
                )}
              >
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                <Typography
                  as="p"
                  variant="body-sm"
                  className="text-xs text-destructive"
                >
                  {submitError}
                </Typography>
              </div>
            )}

            <Dialog.Content.Footer className="gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => handleOpenChange(false)}
              >
                {t("requestQuoteDialog.cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8"
                disabled={createRequest.isPending}
              >
                {createRequest.isPending
                  ? t("requestQuoteDialog.submitting")
                  : t("requestQuoteDialog.submit")}
              </Button>
            </Dialog.Content.Footer>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  )
}
