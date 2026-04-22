"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Typography } from "@workspace/ui/components/typography"

import { useRouter } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { useSkpImport } from "../api/skpImportQueries"

export const SketchUpImportForm = () => {
  const t = useTranslations("SketchUpImport")
  const router = useRouter()
  const [configuratorZip, setConfiguratorZip] = useState<File | null>(null)
  const [productName, setProductName] = useState("")

  const importMutation = useSkpImport()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configuratorZip) return

    try {
      const result = await importMutation.mutateAsync({
        configuratorZip,
        productName: productName.trim() ? productName.trim() : undefined,
      })

      if (result.success && result.productModelId) {
        router.push(ROUTES.configurator(result.productModelId))
      }
    } catch {
      void 0
    }
  }

  const isDisabled = !configuratorZip || importMutation.isPending

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border bg-card p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="productName">{t("form.productName")}</Label>
        <Input
          id="productName"
          type="text"
          placeholder={t("form.productNamePlaceholder")}
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("form.productNameHint")}
        </Typography>
      </div>

      <div className="space-y-2">
        <Label htmlFor="configuratorZip">{t("form.configuratorZip")}</Label>
        <Input
          id="configuratorZip"
          type="file"
          accept=".zip"
          onChange={(e) => setConfiguratorZip(e.target.files?.[0] ?? null)}
        />
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("form.configuratorZipHint")}
        </Typography>
      </div>

      {importMutation.isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <Typography
            as="p"
            variant="body-md"
            className="text-destructive"
          >
            {importMutation.error?.message}
          </Typography>
        </div>
      )}

      <Button
        type="submit"
        disabled={isDisabled}
      >
        {importMutation.isPending ? t("form.submitting") : t("form.submit")}
      </Button>
    </form>
  )
}
