"use client"

import { useCallback, useEffect, useState } from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
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
import { getEmbedBaseUrl } from "@/utils/embedUrl"

/* eslint-disable import/no-restricted-paths -- shared orbit zoom range for embed (same as ModelViewer3D) */
import { EMBED_CAMERA_DISTANCE } from "@/features/configurator/constants/embedCameraDistance"

import { useUpdateProductModel } from "../api/productModelQueries"
import { PublishEmbedLivePreview } from "./PublishEmbedLivePreview"

function clampEmbedZoom(value: number): number {
  return Math.min(Math.max(value, EMBED_CAMERA_DISTANCE.min), EMBED_CAMERA_DISTANCE.max)
}

function embedZoomFromPreference(pref: number | null | undefined): number {
  if (pref == null) return EMBED_CAMERA_DISTANCE.default
  return clampEmbedZoom(pref)
}

const isEmbedDisplayDefault = false

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
  const [urlSaveError, setUrlSaveError] = useState<string | null>(null)

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

  const savedEmbedZoomEffective = embedZoomFromPreference(preferences?.zoomDistanceEmbed)
  const [embedZoom, setEmbedZoom] = useState(savedEmbedZoomEffective)

  useEffect(() => {
    setUrl(productModel.url ?? toUrlPath(productModel.name))
  }, [productModel.url, productModel.name])

  useEffect(() => {
    setUrlSaveError(null)
  }, [url])

  useEffect(() => {
    setShouldShowProductNameInEmbed(preferences?.embedShowProductName ?? isEmbedDisplayDefault)
    setShouldShowDescriptionInEmbed(preferences?.embedShowDescription ?? isEmbedDisplayDefault)
    setShouldShowComponentsInEmbed(preferences?.embedShowComponents ?? isEmbedDisplayDefault)
    setEmbedZoom(embedZoomFromPreference(preferences?.zoomDistanceEmbed))
  }, [
    preferences?.embedShowProductName,
    preferences?.embedShowDescription,
    preferences?.embedShowComponents,
    preferences?.zoomDistanceEmbed,
  ])

  const isUrlValid = url === "" || URL_PATTERN.test(url)
  const isUrlError = url !== "" && !isUrlValid
  const canPublish = isUrlValid && url.trim().length > 0
  const displayUrl = url.trim() ?? productModel.url ?? toUrlPath(productModel.name)
  const embedBaseUrl = getEmbedBaseUrl(env.NEXT_PUBLIC_SITE_URL)
  const embedUrl = `${embedBaseUrl}${ROUTES.embed(productModel.userId, displayUrl)}`
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

  const mapUrlMutationError = (err: unknown): string => {
    if (
      err instanceof Error &&
      "field" in err &&
      (err as { field?: string | null }).field === "url"
    ) {
      return t("urlAlreadyTaken")
    }
    return err instanceof Error ? err.message : t("urlSaveFailed")
  }

  const handlePublishToggle = async (isChecked: boolean) => {
    if (!canPublish && isChecked) return
    setUrlSaveError(null)
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
    if (patches.length === 0) return
    try {
      await updateProductModel.mutateAsync({ id: productModel.id, patches })
    } catch (err) {
      setUrlSaveError(mapUrlMutationError(err))
    }
  }

  const handleSaveUrl = async () => {
    if (!isUrlValid || url.trim() === "") return
    const trimmedUrl = url.trim()
    if (trimmedUrl === productModel.url) return
    setUrlSaveError(null)
    const patches: {
      path: "SlashUrl" | "SlashIsPublished"
      value: string | boolean
      op: "Replace"
    }[] = [{ path: "SlashUrl", value: trimmedUrl, op: "Replace" }]
    if (productModel.isPublished) {
      patches.push({ path: "SlashIsPublished", value: true, op: "Replace" })
    }
    try {
      await updateProductModel.mutateAsync({ id: productModel.id, patches })
    } catch (err) {
      setUrlSaveError(mapUrlMutationError(err))
    }
  }

  const handleCopyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const hasEmbedZoomChanged = Math.abs(embedZoom - savedEmbedZoomEffective) > 0.01

  const hasEmbedDisplayChanged =
    shouldShowProductNameInEmbed !== isEmbedProductNameShownFromServer ||
    shouldShowDescriptionInEmbed !== isEmbedDescriptionShownFromServer ||
    shouldShowComponentsInEmbed !== isEmbedComponentsShownFromServer ||
    hasEmbedZoomChanged

  const handleSaveEmbedDisplay = useCallback(() => {
    if (!hasEmbedDisplayChanged) return
    setEmbedDisplaySaveError(null)
    patchPreferences.mutate(
      {
        embedShowProductName: shouldShowProductNameInEmbed,
        embedShowDescription: shouldShowDescriptionInEmbed,
        embedShowComponents: shouldShowComponentsInEmbed,
        zoomDistanceEmbed: Math.round(clampEmbedZoom(embedZoom) * 100) / 100,
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
    embedZoom,
    patchPreferences,
  ])

  return (
    <Card className="p-4 sm:p-6">
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
          <div className="flex flex-wrap items-center gap-3">
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
            {productModel.isPublished ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handlePublishToggle(false)}
                disabled={updateProductModel.isPending}
              >
                {t("unpublishButton")}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => void handlePublishToggle(true)}
                disabled={updateProductModel.isPending || !canPublish}
              >
                {t("publishButton")}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <div className="space-y-2">
            <Label htmlFor="url-input">{t("urlLabel")}</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="url-input"
                value={url}
                onChange={(e) => setUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder={t("urlPlaceholder")}
                className={cn(
                  "min-w-0 flex-1 font-mono sm:min-w-[200px] sm:flex-initial",
                  (isUrlError || Boolean(urlSaveError)) && "border-destructive",
                )}
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
            {urlSaveError && (
              <Typography
                as="p"
                variant="body-sm"
                className="text-destructive"
              >
                {urlSaveError}
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
              <pre className="max-h-36 overflow-auto rounded bg-muted p-3 text-xs">
                <code>{embedCode}</code>
              </pre>

              <details
                className="group mt-4"
                open
              >
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
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label
                        htmlFor="publish-embed-default-zoom"
                        className="text-sm font-medium"
                      >
                        {t("embedDisplay.defaultZoomLabel")}
                      </Label>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {clampEmbedZoom(embedZoom).toFixed(1)}
                      </span>
                    </div>
                    <SliderPrimitive.Root
                      id="publish-embed-default-zoom"
                      className="relative flex w-full max-w-md touch-none items-center select-none"
                      min={EMBED_CAMERA_DISTANCE.min}
                      max={EMBED_CAMERA_DISTANCE.max}
                      step={EMBED_CAMERA_DISTANCE.step}
                      value={[clampEmbedZoom(embedZoom)]}
                      onValueChange={(values) => {
                        const v = values[0] ?? EMBED_CAMERA_DISTANCE.default
                        setEmbedZoom(clampEmbedZoom(v))
                      }}
                      aria-label={t("embedDisplay.defaultZoomLabel")}
                    >
                      <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-muted">
                        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary/30" />
                      </SliderPrimitive.Track>
                      <SliderPrimitive.Thumb className="block h-3 w-3 rounded-full border-2 border-primary bg-background shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" />
                    </SliderPrimitive.Root>
                    <Typography
                      as="p"
                      variant="body-sm"
                      className="text-muted-foreground"
                    >
                      {t("embedDisplay.defaultZoomHint")}
                    </Typography>
                  </div>
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

              <div className="mt-6 space-y-2">
                <Typography
                  as="h4"
                  variant="display-sm"
                  weight="semibold"
                >
                  {t("embedPreviewTitle")}
                </Typography>
                <Typography
                  as="p"
                  variant="body-sm"
                  className="text-muted-foreground"
                >
                  {t("embedPreviewLiveHint")}
                </Typography>
                <PublishEmbedLivePreview
                  key={productModel.id}
                  productModel={productModel}
                  liveCameraDistance={clampEmbedZoom(embedZoom)}
                  embedUiOverrides={{
                    showProductName: shouldShowProductNameInEmbed,
                    showDescription: shouldShowDescriptionInEmbed,
                    showComponents: shouldShowComponentsInEmbed,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
