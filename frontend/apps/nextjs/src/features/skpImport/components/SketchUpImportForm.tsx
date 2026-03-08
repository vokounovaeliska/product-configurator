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
  const [skpFile, setSkpFile] = useState<File | null>(null)
  const [glbFile, setGlbFile] = useState<File | null>(null)
  const [parametersJson, setParametersJson] = useState<File | null>(null)
  const [parametersZip, setParametersZip] = useState<File | null>(null)
  const [productName, setProductName] = useState("")

  const importMutation = useSkpImport()

  const hasParameters = Boolean(skpFile ?? parametersJson ?? parametersZip)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!glbFile || !hasParameters) return

    try {
      const result = await importMutation.mutateAsync({
        skpFile: skpFile ?? undefined,
        glbFile,
        productName: productName.trim() ? productName.trim() : undefined,
        parametersJson: parametersJson ?? undefined,
        parametersZip: parametersZip ?? undefined,
      })

      if (result.success && result.productModelId) {
        router.push(ROUTES.setupPricingRules(result.productModelId))
      }
    } catch {
      // Error is handled by mutation
    }
  }

  const isDisabled = !glbFile || !hasParameters || importMutation.isPending

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
        <Label htmlFor="skpFile">{t("form.skpFile")}</Label>
        <Input
          id="skpFile"
          type="file"
          accept=".skp"
          onChange={(e) => setSkpFile(e.target.files?.[0] ?? null)}
        />
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("form.skpFileHint")}
        </Typography>
      </div>

      <div className="space-y-2">
        <Label htmlFor="glbFile">{t("form.glbFile")}</Label>
        <Input
          id="glbFile"
          type="file"
          accept=".glb"
          onChange={(e) => setGlbFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="parametersJson">{t("form.parametersJson")}</Label>
        <Input
          id="parametersJson"
          type="file"
          accept=".json"
          onChange={(e) => {
            setParametersJson(e.target.files?.[0] ?? null)
            if (e.target.files?.[0]) setParametersZip(null)
          }}
        />
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("form.parametersJsonHint")}
        </Typography>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parametersZip">{t("form.parametersZip")}</Label>
        <Input
          id="parametersZip"
          type="file"
          accept=".zip"
          onChange={(e) => {
            setParametersZip(e.target.files?.[0] ?? null)
            if (e.target.files?.[0]) setParametersJson(null)
          }}
        />
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("form.parametersZipHint")}
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
