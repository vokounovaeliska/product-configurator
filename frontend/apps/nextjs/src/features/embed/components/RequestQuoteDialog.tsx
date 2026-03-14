"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircleIcon, CheckCircleIcon } from "lucide-react"
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
import { cn } from "@workspace/ui/lib/utils"

import type { ProductModelEmbedDto } from "@/api/embedTypes"

import { useCreateCustomerRequest } from "@/features/embed/api/embedQueries"
import { capture2DSnapshot } from "@/features/embed/utils/capture2DSnapshot"

import {
  requestQuoteFormSchema,
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

  const form = useForm<RequestQuoteFormSchema>({
    resolver: zodResolver(requestQuoteFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerNote: "",
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
        <Dialog.Content className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <Dialog.Content.Header>
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircleIcon className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <Dialog.Content.Header.Title>
                  {t("requestQuoteDialog.success.title")}
                </Dialog.Content.Header.Title>
                <Dialog.Content.Header.Description>
                  {t("requestQuoteDialog.success.description")}
                </Dialog.Content.Header.Description>
              </div>
            </div>
          </Dialog.Content.Header>
          <Dialog.Content.Footer>
            <Button
              onClick={() => handleOpenChange(false)}
              variant="outline"
            >
              {t("requestQuoteDialog.success.close")}
            </Button>
          </Dialog.Content.Footer>
        </Dialog.Content>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <Dialog.Content className="sm:max-w-md">
        <Dialog.Content.Header>
          <Dialog.Content.Header.Title>{t("requestQuoteDialog.title")}</Dialog.Content.Header.Title>
          <Dialog.Content.Header.Description>
            {t("requestQuoteDialog.description")}
          </Dialog.Content.Header.Description>
        </Dialog.Content.Header>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("requestQuoteDialog.fields.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("requestQuoteDialog.fields.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("requestQuoteDialog.fields.email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("requestQuoteDialog.fields.emailPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("requestQuoteDialog.fields.phone")}</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder={t("requestQuoteDialog.fields.phonePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("requestQuoteDialog.fields.message")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("requestQuoteDialog.fields.messagePlaceholder")}
                      rows={4}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {submitError && (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4",
                )}
              >
                <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
                <Typography
                  as="p"
                  variant="body-sm"
                  className="text-destructive"
                >
                  {submitError}
                </Typography>
              </div>
            )}

            <Dialog.Content.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t("requestQuoteDialog.cancel")}
              </Button>
              <Button
                type="submit"
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
