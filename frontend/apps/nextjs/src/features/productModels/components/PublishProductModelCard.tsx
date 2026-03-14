"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckIcon, ChevronDownIcon, CopyIcon, ExternalLinkIcon, SparklesIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import {
  useConfiguratorPreferences,
  usePatchConfiguratorPreferences,
} from "@/api/configuratorPreferencesQueries"
import type { ProductModelDto } from "@/api/productModelTypes"
import { env } from "@/config/env"
import { ROUTES } from "@/lib/routes"
import { extractErrorMessage } from "@/lib/utils"

import { useUpdateProductModel } from "../api/productModelQueries"

const isEmbedDisplayDefault = true

const URL_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const toUrlPath = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || ""

type Props = {
  productModel: ProductModelDto
}

export const PublishProductModelCard = ({ productModel }: Props) => {
  const t = useTranslations("ProductModels.Publish")
  const [url, setUrl] = useState(productModel.url ?? toUrlPath(productModel.name))
  const [isCopied, setIsCopied] = useState(false)
  const [embedDisplaySaveError, setEmbedDisplaySaveError] = useState<string | null>(null)

  const updateProductModel = useUpdateProductModel()
  const { data: preferences } = useConfiguratorPreferences(productModel.id)
  const patchPreferences = usePatchConfiguratorPreferences(productModel.id)

  const isEmbedProductNameShownFromServer =
    preferences?.embedShowProductName ?? isEmbedDisplayDefault
  const isEmbedDescriptionShownFromServer =
    preferences?.embedShowDescription ?? isEmbedDisplayDefault
  const isEmbedComponentsShownFromServer = preferences?.embedShowComponents ?? isEmbedDisplayDefault

  const [shouldShowProductNameInEmbed, setShouldShowProductNameInEmbed] = useState(
    isEmbedProductNameShownFromServer,
  )
  const [shouldShowDescriptionInEmbed, setShouldShowDescriptionInEmbed] = useState(
    isEmbedDescriptionShownFromServer,
  )
  const [shouldShowComponentsInEmbed, setShouldShowComponentsInEmbed] = useState(
    isEmbedComponentsShownFromServer,
  )

  useEffect(() => {
    setUrl(productModel.url ?? toUrlPath(productModel.name))
  }, [productModel.url, productModel.name])

  useEffect(() => {
    setShouldShowProductNameInEmbed(preferences?.embedShowProductName ?? isEmbedDisplayDefault)
    setShouldShowDescriptionInEmbed(preferences?.embedShowDescription ?? isEmbedDisplayDefault)
    setShouldShowComponentsInEmbed(preferences?.embedShowComponents ?? isEmbedDisplayDefault)
  }, [
    preferences?.embedShowProductName,
    preferences?.embedShowDescription,
    preferences?.embedShowComponents,
  ])

  const isUrlValid = url === "" || URL_PATTERN.test(url)
  const isUrlError = url !== "" && !isUrlValid
  const canPublish = isUrlValid && url.trim().length > 0
  const displayUrl = url.trim() ?? productModel.url ?? toUrlPath(productModel.name)
  // Use HTTPS for embed URLs in production to avoid Mixed Content; keep HTTP on localhost
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(
    env.NEXT_PUBLIC_SITE_URL,
  )
  const embedBaseUrl = isLocalhost
    ? env.NEXT_PUBLIC_SITE_URL
    : env.NEXT_PUBLIC_SITE_URL.replace(/^http:\/\//, "https://")
  const embedUrl = `${embedBaseUrl}${ROUTES.embed(displayUrl)}`
  const embedCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="700"
  style="border: none; min-height: 600px;"
  allowfullscreen
></iframe>`

  const handleSuggestUrl = () => {
    setUrl(toUrlPath(productModel.name))
  }

  const handlePublishToggle = async (isChecked: boolean) => {
    if (!canPublish && isChecked) return
    const patches: {
      path: "SlashUrl" | "SlashIsPublished"
      value: string | boolean
      op: "Replace"
    }[] = []
    if (isChecked) {
      const finalUrl = url.trim() || toUrlPath(productModel.name)
      if (finalUrl !== productModel.url) {
        patches.push({ path: "SlashUrl", value: finalUrl, op: "Replace" })
      }
      patches.push({ path: "SlashIsPublished", value: true, op: "Replace" })
    } else {
      patches.push({ path: "SlashIsPublished", value: false, op: "Replace" })
    }
    if (patches.length > 0) {
      await updateProductModel.mutateAsync({ id: productModel.id, patches })
    }
  }

  const handleSaveUrl = async () => {
    if (!isUrlValid || url.trim() === "") return
    const trimmedUrl = url.trim()
    if (trimmedUrl === productModel.url) return
    const patches: {
      path: "SlashUrl" | "SlashIsPublished"
      value: string | boolean
      op: "Replace"
    }[] = [{ path: "SlashUrl", value: trimmedUrl, op: "Replace" }]
    if (productModel.isPublished) {
      patches.push({ path: "SlashIsPublished", value: true, op: "Replace" })
    }
    await updateProductModel.mutateAsync({ id: productModel.id, patches })
  }

  const handleCopyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const hasEmbedDisplayChanged =
    shouldShowProductNameInEmbed !== isEmbedProductNameShownFromServer ||
    shouldShowDescriptionInEmbed !== isEmbedDescriptionShownFromServer ||
    shouldShowComponentsInEmbed !== isEmbedComponentsShownFromServer

  const handleSaveEmbedDisplay = useCallback(() => {
    if (!hasEmbedDisplayChanged) return
    setEmbedDisplaySaveError(null)
    patchPreferences.mutate(
      {
        embedShowProductName: shouldShowProductNameInEmbed,
        embedShowDescription: shouldShowDescriptionInEmbed,
        embedShowComponents: shouldShowComponentsInEmbed,
      },
      {
        onSuccess: () => setEmbedDisplaySaveError(null),
        onError: (error) => {
          void extractErrorMessage(error).then(setEmbedDisplaySaveError)
        },
      },
    )
  }, [
    hasEmbedDisplayChanged,
    shouldShowProductNameInEmbed,
    shouldShowDescriptionInEmbed,
    shouldShowComponentsInEmbed,
    patchPreferences,
  ])

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Typography
              as="h3"
              variant="display-md"
              weight="semibold"
            >
              {t("title")}
            </Typography>
            <Typography
              as="p"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("description")}
            </Typography>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                productModel.isPublished
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {productModel.isPublished ? t("status.published") : t("status.draft")}
            </span>
            <div className="flex items-center gap-2">
              <Checkbox
                id="publish-toggle"
                checked={Boolean(productModel.isPublished)}
                onCheckedChange={(value) => handlePublishToggle(Boolean(value))}
                disabled={
                  updateProductModel.isPending || (!productModel.isPublished && !canPublish)
                }
              />
              <Label
                htmlFor="publish-toggle"
                className="cursor-pointer text-sm font-medium"
              >
                {t("publishToggle")}
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <div className="space-y-2">
            <Label htmlFor="url-input">{t("urlLabel")}</Label>
            <div className="flex gap-2">
              <Input
                id="url-input"
                value={url}
                onChange={(e) => setUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder={t("urlPlaceholder")}
                className={cn("font-mono", isUrlError && "border-destructive")}
                disabled={updateProductModel.isPending}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleSuggestUrl}
                title={t("suggestUrl")}
                disabled={updateProductModel.isPending}
              >
                <SparklesIcon className="size-4" />
              </Button>
              {url !== (productModel.url ?? toUrlPath(productModel.name)) && isUrlValid && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveUrl}
                  disabled={updateProductModel.isPending}
                >
                  {t("saveUrl")}
                </Button>
              )}
            </div>
            {isUrlError && (
              <Typography
                as="p"
                variant="body-sm"
                className="text-destructive"
              >
                {t("urlError")}
              </Typography>
            )}
            <Typography
              as="p"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("urlHint")}
            </Typography>
          </div>

          {productModel.isPublished && productModel.url && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <Typography
                as="h4"
                variant="display-sm"
                weight="semibold"
              >
                {t("embedCodeTitle")}
              </Typography>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyEmbed}
                >
                  {isCopied ? (
                    <>
                      <CheckIcon className="mr-2 size-4" />
                      {t("copied")}
                    </>
                  ) : (
                    <>
                      <CopyIcon className="mr-2 size-4" />
                      {t("copyEmbed")}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLinkIcon className="mr-2 size-4" />
                    {t("previewEmbed")}
                  </a>
                </Button>
              </div>
              <pre className="max-h-24 overflow-auto rounded bg-muted p-3 text-xs">
                <code>{embedCode}</code>
              </pre>

              <details className="group mt-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
                  <ChevronDownIcon className="size-4 shrink-0 transition-transform group-open:rotate-180" />
                  {t("embedDisplay.title")}
                </summary>
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  <Typography
                    as="p"
                    variant="body-sm"
                    className="text-muted-foreground"
                  >
                    {t("embedDisplay.description")}
                  </Typography>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="publish-embed-show-product-name"
                        checked={shouldShowProductNameInEmbed}
                        onCheckedChange={(v) => setShouldShowProductNameInEmbed(Boolean(v))}
                      />
                      <Label
                        htmlFor="publish-embed-show-product-name"
                        className="cursor-pointer text-sm font-normal"
                      >
                        {t("embedDisplay.showProductName")}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="publish-embed-show-description"
                        checked={shouldShowDescriptionInEmbed}
                        onCheckedChange={(v) => setShouldShowDescriptionInEmbed(Boolean(v))}
                      />
                      <Label
                        htmlFor="publish-embed-show-description"
                        className="cursor-pointer text-sm font-normal"
                      >
                        {t("embedDisplay.showDescription")}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="publish-embed-show-components"
                        checked={shouldShowComponentsInEmbed}
                        onCheckedChange={(v) => setShouldShowComponentsInEmbed(Boolean(v))}
                      />
                      <Label
                        htmlFor="publish-embed-show-components"
                        className="cursor-pointer text-sm font-normal"
                      >
                        {t("embedDisplay.showComponents")}
                      </Label>
                    </div>
                  </div>
                  {embedDisplaySaveError && (
                    <Typography
                      as="p"
                      variant="body-sm"
                      className="text-destructive"
                    >
                      {embedDisplaySaveError}
                    </Typography>
                  )}
                  {hasEmbedDisplayChanged && (
                    <Button
                      size="sm"
                      onClick={handleSaveEmbedDisplay}
                      disabled={patchPreferences.isPending}
                    >
                      {patchPreferences.isPending
                        ? t("embedDisplay.saving")
                        : t("embedDisplay.save")}
                    </Button>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
