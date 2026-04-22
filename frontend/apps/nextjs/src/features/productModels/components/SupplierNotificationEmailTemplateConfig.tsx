"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select } from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import type { QuoteRequestEmailTemplatePreset } from "@/api/configuratorPreferencesTypes"

const SUPPLIER_LABEL_KEYS = [
  "customer",
  "phone",
  "product",
  "totalPrice",
  "description",
  "customerMessage",
  "customerChoices",
  "configurationPreview",
] as const

const SUPPLIER_LABEL_T_KEYS: Record<(typeof SUPPLIER_LABEL_KEYS)[number], string> = {
  customer: "labelCustomer",
  phone: "labelPhone",
  product: "labelProduct",
  totalPrice: "labelTotalPrice",
  description: "labelDescription",
  customerMessage: "labelCustomerMessage",
  customerChoices: "labelCustomerChoices",
  configurationPreview: "labelConfigurationPreview",
}

const SAMPLE_REQUEST = {
  customerName: "Jan Novák",
  productName: "Stůl",
  totalPrice: "15 000 Kč",
  customerNote: "Rád bych objednal do konce měsíce.",
  customerEmail: "jan@example.cz",
  customerPhone: "+420 123 456 789",
}

const SAMPLE_CHOICES = ["Barva: Černá", "Dřevo: Dub"]

const EXAMPLE_CONFIGURATION_PREVIEW_IMAGE = "/images/example-email-configuration-preview.png"

const DEFAULT_TEMPLATES = {
  en: {
    subject: "New quote request: {{productName}} from {{customerName}}",
    body:
      "You have received a new quote request.\n\n" +
      "Reply to this email to respond directly to the customer.",
  },
  cs: {
    subject: "Nová cenová poptávka: {{productName}} od {{customerName}}",
    body:
      "Obdrželi jste novou cenovou poptávku.\n\n" +
      "Odpovězte na tento e-mail pro přímou odpověď zákazníkovi.",
  },
} as const

const replacePlaceholders = (text: string): string =>
  text
    .replace(/\{\{customerName\}\}/g, SAMPLE_REQUEST.customerName)
    .replace(/\{\{productName\}\}/g, SAMPLE_REQUEST.productName)
    .replace(/\{\{totalPrice\}\}/g, SAMPLE_REQUEST.totalPrice)
    .replace(/\{\{customerNote\}\}/g, SAMPLE_REQUEST.customerNote)
    .replace(/\{\{customerEmail\}\}/g, SAMPLE_REQUEST.customerEmail)
    .replace(/\{\{customerPhone\}\}/g, SAMPLE_REQUEST.customerPhone)

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const plainTextToHtml = (text: string): string =>
  text
    .split(/\n\n+/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("\n")

const htmlToPlainText = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim()

type Props = {
  preset: string | null
  subject: string | null
  body: string | null
  bodyIsHtml?: boolean
  labels?: Record<string, string> | null
  onSave: (patch: {
    supplierNotificationEmailTemplatePreset?: string | null
    supplierNotificationEmailSubject?: string | null
    supplierNotificationEmailBody?: string | null
    supplierNotificationEmailBodyIsHtml?: boolean
    supplierNotificationEmailLabels?: Record<string, string> | null
  }) => void
  isPending: boolean
  saveError: string | null

  defaultOpen?: boolean
}

const DEFAULT_LABELS_EN: Record<string, string> = {
  customer: "Customer",
  phone: "Phone",
  product: "Product",
  totalPrice: "Total price",
  description: "Description",
  customerMessage: "Customer message",
  customerChoices: "Customer choices",
  configurationPreview: "Configuration preview",
}

const DEFAULT_LABELS_CS: Record<string, string> = {
  customer: "Zákazník",
  phone: "Telefon",
  product: "Produkt",
  totalPrice: "Celková cena",
  description: "Popis",
  customerMessage: "Zpráva zákazníka",
  customerChoices: "Volby zákazníka",
  configurationPreview: "Náhled konfigurace",
}

export const SupplierNotificationEmailTemplateConfig = ({
  preset,
  subject,
  body,
  bodyIsHtml: isBodyHtml = false,
  labels: labelsFromServer,
  onSave,
  isPending,
  saveError,
}: Props) => {
  const t = useTranslations("ProductModels.Publish.supplierEmailTemplate")
  const [selectedPreset, setSelectedPreset] = useState<QuoteRequestEmailTemplatePreset>(
    (preset as QuoteRequestEmailTemplatePreset) ?? "en",
  )
  const [customSubject, setCustomSubject] = useState(subject ?? "")
  const [customBody, setCustomBody] = useState(body ?? "")
  const [isCustomBodyHtml, setCustomBodyIsHtml] = useState(isBodyHtml)
  const [labels, setLabels] = useState<Record<string, string>>(() => labelsFromServer ?? {})

  useEffect(() => {
    if (preset === "en" || preset === "cs") {
      setSelectedPreset(preset)
    } else if (subject ?? body) {
      setSelectedPreset("custom")
      setCustomSubject(subject ?? "")
      setCustomBody(body ?? "")
      setCustomBodyIsHtml(isBodyHtml)
    } else {
      setSelectedPreset("en")
    }
  }, [preset, subject, body, isBodyHtml])

  useEffect(() => {
    setLabels((prev) => ({ ...prev, ...(labelsFromServer ?? {}) }))
  }, [labelsFromServer])

  useEffect(() => {
    if (
      selectedPreset === "custom" &&
      (preset === "en" || preset === "cs") &&
      !Object.values(labels).some((v) => v.trim().length > 0)
    ) {
      setLabels(preset === "cs" ? DEFAULT_LABELS_CS : DEFAULT_LABELS_EN)
    }
  }, [selectedPreset, preset, labels])

  const defaultLabels = selectedPreset === "cs" ? DEFAULT_LABELS_CS : DEFAULT_LABELS_EN
  const effectiveLabels = SUPPLIER_LABEL_KEYS.reduce<Record<string, string>>(
    (acc, key) => ({
      ...acc,
      [key]: labels[key]?.trim() ?? defaultLabels[key] ?? key,
    }),
    {},
  )

  const previewSubject =
    selectedPreset === "custom"
      ? replacePlaceholders(customSubject ?? DEFAULT_TEMPLATES.en.subject)
      : replacePlaceholders(DEFAULT_TEMPLATES[selectedPreset].subject)
  const previewBody =
    selectedPreset === "custom"
      ? replacePlaceholders(customBody ?? DEFAULT_TEMPLATES.en.body)
      : replacePlaceholders(DEFAULT_TEMPLATES[selectedPreset].body)

  const serverLabels = labelsFromServer ?? {}
  const isLabelsDirty =
    SUPPLIER_LABEL_KEYS.some((k) => (labels[k] ?? "").trim() !== (serverLabels[k] ?? "").trim()) ||
    (Object.keys(serverLabels).length === 0 &&
      Object.values(labels).some((v: string) => v.trim().length > 0))

  const hasChanged =
    (selectedPreset === "en" && preset !== "en") ||
    (selectedPreset === "cs" && preset !== "cs") ||
    (selectedPreset === "custom" &&
      (preset !== "custom" ||
        customSubject !== (subject ?? "") ||
        customBody !== (body ?? "") ||
        isCustomBodyHtml !== isBodyHtml)) ||
    isLabelsDirty

  const handleSave = useCallback(() => {
    if (!hasChanged) return
    const labelsToSave = Object.fromEntries(
      Object.entries(labels).filter(([, v]) => v.trim().length > 0),
    )
    onSave({
      supplierNotificationEmailTemplatePreset: selectedPreset,
      supplierNotificationEmailSubject:
        selectedPreset === "custom" ? (customSubject ?? null) : null,
      supplierNotificationEmailBody: selectedPreset === "custom" ? (customBody ?? null) : null,
      supplierNotificationEmailBodyIsHtml:
        selectedPreset === "custom" ? isCustomBodyHtml : undefined,
      supplierNotificationEmailLabels: Object.keys(labelsToSave).length > 0 ? labelsToSave : null,
    })
  }, [hasChanged, selectedPreset, customSubject, customBody, isCustomBodyHtml, labels, onSave])

  return (
    <div className="mt-4 space-y-4">
      <Typography
        as="p"
        variant="body-sm"
        className="text-muted-foreground"
      >
        {t("description")}
      </Typography>

      <div className="space-y-2">
        <Label>{t("presetLabel")}</Label>
        <Select
          value={selectedPreset}
          onValueChange={(v) => setSelectedPreset(v as QuoteRequestEmailTemplatePreset)}
        >
          <Select.Trigger className="w-full max-w-xs">
            <Select.Trigger.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Content.Item value="en">{t("presetEn")}</Select.Content.Item>
            <Select.Content.Item value="cs">{t("presetCs")}</Select.Content.Item>
            <Select.Content.Item value="custom">{t("presetCustom")}</Select.Content.Item>
          </Select.Content>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {selectedPreset === "custom" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCustomSubject(DEFAULT_TEMPLATES.en.subject)
                  setCustomBody(DEFAULT_TEMPLATES.en.body)
                  setLabels(DEFAULT_LABELS_EN)
                }}
              >
                {t("loadFromEn")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCustomSubject(DEFAULT_TEMPLATES.cs.subject)
                  setCustomBody(DEFAULT_TEMPLATES.cs.body)
                  setLabels(DEFAULT_LABELS_CS)
                }}
              >
                {t("loadFromCs")}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-email-subject">{t("subjectLabel")}</Label>
              <Textarea
                id="supplier-email-subject"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder={DEFAULT_TEMPLATES.en.subject}
                rows={1}
                className="resize-none font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="supplier-email-body-html"
                  checked={isCustomBodyHtml}
                  onCheckedChange={(v) => {
                    const isToHtml = Boolean(v)
                    setCustomBodyIsHtml(isToHtml)
                    setCustomBody((prev) =>
                      prev ? (isToHtml ? plainTextToHtml(prev) : htmlToPlainText(prev)) : prev,
                    )
                  }}
                />
                <Label
                  htmlFor="supplier-email-body-html"
                  className="cursor-pointer text-sm font-normal"
                >
                  {t("bodyIsHtmlLabel")}
                </Label>
              </div>
              <Label htmlFor="supplier-email-body">{t("bodyLabel")}</Label>
              <Textarea
                id="supplier-email-body"
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder={
                  isCustomBodyHtml
                    ? "<p>You have received a new quote request.</p><p>...</p>"
                    : DEFAULT_TEMPLATES.en.body
                }
                className="resize-y font-mono text-sm"
                style={{ height: "300px" }}
              />
              <Typography
                as="p"
                variant="body-sm"
                className="text-muted-foreground"
              >
                {t("placeholdersHint")}
              </Typography>
            </div>
          </div>
        )}

        <div className={cn("space-y-2", selectedPreset !== "custom" && "lg:col-span-2")}>
          <Label>{t("previewTitle")}</Label>
          <div
            className={cn(
              "min-h-[200px] overflow-auto rounded-lg border border-border bg-card p-4 text-base lg:min-h-[280px]",
              "font-sans leading-relaxed text-foreground",
            )}
          >
            <div className="rounded-t-lg border-b border-border bg-muted/50 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t("previewInbox" as "previewTitle")}
              </p>
            </div>
            <div className="border-b border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {t("previewFrom" as "previewTitle")}: Konfiguruj &lt;info@konfiguruj.com&gt;
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("previewTo" as "previewTitle")}: mně
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{previewSubject}</p>
            </div>
            <div
              className="rounded bg-card p-4 text-base text-foreground"
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                lineHeight: 1.6,
                fontSize: "16px",
                maxWidth: "100%",
              }}
              dangerouslySetInnerHTML={{
                __html: [
                  selectedPreset === "custom" && isCustomBodyHtml
                    ? replacePlaceholders(customBody ?? DEFAULT_TEMPLATES.en.body)
                    : `<p style="font-size: 16px;">${escapeHtml(previewBody).replace(/\n/g, "<br>")}</p>`,
                  `<div style="background: var(--card); border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid var(--border); box-shadow: 0 1px 2px rgba(0,0,0,0.05); color: var(--foreground);">`,
                  `<p style="margin: 0 0 8px 0;"><strong>${escapeHtml(effectiveLabels.customer ?? "")}:</strong> ${escapeHtml(SAMPLE_REQUEST.customerName)} &lt;${escapeHtml(SAMPLE_REQUEST.customerEmail)}&gt;</p>`,
                  SAMPLE_REQUEST.customerPhone
                    ? `<p style="margin: 0 0 8px 0;"><strong>${escapeHtml(effectiveLabels.phone ?? "")}:</strong> ${escapeHtml(SAMPLE_REQUEST.customerPhone)}</p>`
                    : "",
                  `<p style="margin: 0 0 8px 0;"><strong>${escapeHtml(effectiveLabels.product ?? "")}:</strong> ${escapeHtml(SAMPLE_REQUEST.productName)}</p>`,
                  `<p style="margin: 0 0 8px 0;"><strong>${escapeHtml(effectiveLabels.totalPrice ?? "")}:</strong> ${escapeHtml(SAMPLE_REQUEST.totalPrice)}</p>`,
                  `<p style="margin: 8px 0 0 0;"><strong>${escapeHtml(effectiveLabels.customerChoices ?? "")}:</strong></p>` +
                    `<ul style="margin: 4px 0 0 0; padding-left: 20px;">${SAMPLE_CHOICES.map((c) => `<li style="margin: 2px 0;">${escapeHtml(c)}</li>`).join("")}</ul>`,
                  SAMPLE_REQUEST.customerNote
                    ? `<p style="margin: 8px 0 0 0;"><strong>${escapeHtml(effectiveLabels.customerMessage ?? "")}:</strong> ${escapeHtml(SAMPLE_REQUEST.customerNote)}</p>`
                    : "",
                  `</div>`,
                  `<p style="margin: 16px 0 8px 0;"><strong>${escapeHtml(effectiveLabels.configurationPreview ?? "")}:</strong></p>`,
                  `<p style="margin: 0;"><img src="${EXAMPLE_CONFIGURATION_PREVIEW_IMAGE}" alt="Configuration" style="max-width: 70%; height: auto; border-radius: 8px; border: 1px solid var(--border);" /></p>`,
                ].join(""),
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("labelsSectionTitle")}</Label>
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("labelsSectionHint")}
        </Typography>
        <div className="grid gap-2 sm:grid-cols-2">
          {SUPPLIER_LABEL_KEYS.map((key) => (
            <div
              key={key}
              className="space-y-1"
            >
              <Label
                htmlFor={`supplier-label-${key}`}
                className="text-xs text-muted-foreground"
              >
                {t(SUPPLIER_LABEL_T_KEYS[key] as "labelProduct")}
              </Label>
              <Input
                id={`supplier-label-${key}`}
                value={labels[key] ?? ""}
                onChange={(e) => setLabels((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={defaultLabels[key]}
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {saveError && (
        <Typography
          as="p"
          variant="body-sm"
          className="text-destructive"
        >
          {saveError}
        </Typography>
      )}
      {hasChanged && (
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending || (selectedPreset === "custom" && !customSubject && !customBody)}
        >
          {isPending ? t("saving") : t("save")}
        </Button>
      )}
    </div>
  )
}
