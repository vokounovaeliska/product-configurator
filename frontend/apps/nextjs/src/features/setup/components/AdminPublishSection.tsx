"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { useCurrentUser, usePatchCurrentUser } from "@/api/userQueries"
import type { UserPatchRequestDto } from "@/api/userTypes"
import { extractErrorMessage } from "@/lib/utils"

/* eslint-disable import/no-restricted-paths -- setup publish section composes email template configs */
import { QuoteRequestEmailTemplateConfig } from "@/features/productModels/components/QuoteRequestEmailTemplateConfig"
import { SupplierNotificationEmailTemplateConfig } from "@/features/productModels/components/SupplierNotificationEmailTemplateConfig"

/* eslint-enable import/no-restricted-paths */

const EMAIL_PATTERN = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/

type EmailTab = "customer" | "supplier"

export const AdminPublishSection = () => {
  const t = useTranslations("Setup.Publish")
  const tProductModels = useTranslations("ProductModels.Publish")
  const [activeEmailTab, setActiveEmailTab] = useState<EmailTab>("customer")
  const [ordersRecipientEmail, setOrdersRecipientEmail] = useState("")
  const [ordersEmailSaveError, setOrdersEmailSaveError] = useState<string | null>(null)
  const [emailTemplateSaveError, setEmailTemplateSaveError] = useState<string | null>(null)
  const [supplierEmailTemplateSaveError, setSupplierEmailTemplateSaveError] = useState<
    string | null
  >(null)

  const { data: currentUser } = useCurrentUser()
  const patchCurrentUser = usePatchCurrentUser()

  useEffect(() => {
    setOrdersRecipientEmail(currentUser?.notificationEmail ?? "")
  }, [currentUser?.notificationEmail])

  const ordersEmailFromServer = currentUser?.notificationEmail ?? ""
  const trimmedOrdersRecipientEmail = ordersRecipientEmail.trim()
  const isOrdersEmailValid =
    trimmedOrdersRecipientEmail.length === 0 || EMAIL_PATTERN.test(trimmedOrdersRecipientEmail)
  const hasOrdersEmailChanged = trimmedOrdersRecipientEmail !== ordersEmailFromServer

  const handleSaveOrdersEmail = useCallback(() => {
    if (!currentUser?.id || !isOrdersEmailValid || !hasOrdersEmailChanged) return

    const patchValue = trimmedOrdersRecipientEmail.length > 0 ? trimmedOrdersRecipientEmail : null
    const patches: UserPatchRequestDto[] = [
      {
        path: "SlashNotificationEmail",
        op: "Replace",
        value: patchValue,
      },
    ]

    setOrdersEmailSaveError(null)
    patchCurrentUser.mutate(
      {
        userId: currentUser.id,
        patches,
      },
      {
        onSuccess: () => setOrdersEmailSaveError(null),
        onError: (error) => {
          void extractErrorMessage(error).then(setOrdersEmailSaveError)
        },
      },
    )
  }, [
    currentUser?.id,
    hasOrdersEmailChanged,
    isOrdersEmailValid,
    patchCurrentUser,
    trimmedOrdersRecipientEmail,
  ])

  const handleSaveEmailTemplate = useCallback(
    (patch: {
      quoteRequestEmailTemplatePreset?: string | null
      quoteRequestEmailSubject?: string | null
      quoteRequestEmailBody?: string | null
      quoteRequestEmailBodyIsHtml?: boolean
      quoteRequestEmailLabels?: Record<string, string> | null
    }) => {
      if (!currentUser?.id) return

      const patches: UserPatchRequestDto[] = []
      if (patch.quoteRequestEmailTemplatePreset !== undefined) {
        patches.push({
          path: "SlashQuoteRequestEmailTemplatePreset",
          op: "Replace",
          value: patch.quoteRequestEmailTemplatePreset,
        })
      }
      if (patch.quoteRequestEmailSubject !== undefined) {
        patches.push({
          path: "SlashQuoteRequestEmailSubject",
          op: "Replace",
          value: patch.quoteRequestEmailSubject,
        })
      }
      if (patch.quoteRequestEmailBody !== undefined) {
        patches.push({
          path: "SlashQuoteRequestEmailBody",
          op: "Replace",
          value: patch.quoteRequestEmailBody,
        })
      }
      if (patch.quoteRequestEmailBodyIsHtml !== undefined) {
        patches.push({
          path: "SlashQuoteRequestEmailBodyIsHtml",
          op: "Replace",
          value: patch.quoteRequestEmailBodyIsHtml,
        })
      }
      if (patch.quoteRequestEmailLabels !== undefined) {
        patches.push({
          path: "SlashQuoteRequestEmailLabels",
          op: "Replace",
          value: patch.quoteRequestEmailLabels,
        })
      }
      if (patches.length === 0) return

      setEmailTemplateSaveError(null)
      patchCurrentUser.mutate(
        {
          userId: currentUser.id,
          patches,
        },
        {
          onSuccess: () => setEmailTemplateSaveError(null),
          onError: (error) => {
            void extractErrorMessage(error).then(setEmailTemplateSaveError)
          },
        },
      )
    },
    [currentUser?.id, patchCurrentUser],
  )

  const handleSaveSupplierEmailTemplate = useCallback(
    (patch: {
      supplierNotificationEmailTemplatePreset?: string | null
      supplierNotificationEmailSubject?: string | null
      supplierNotificationEmailBody?: string | null
      supplierNotificationEmailBodyIsHtml?: boolean
      supplierNotificationEmailLabels?: Record<string, string> | null
    }) => {
      if (!currentUser?.id) return

      const patches: UserPatchRequestDto[] = []
      if (patch.supplierNotificationEmailTemplatePreset !== undefined) {
        patches.push({
          path: "SlashSupplierNotificationEmailTemplatePreset",
          op: "Replace",
          value: patch.supplierNotificationEmailTemplatePreset,
        })
      }
      if (patch.supplierNotificationEmailSubject !== undefined) {
        patches.push({
          path: "SlashSupplierNotificationEmailSubject",
          op: "Replace",
          value: patch.supplierNotificationEmailSubject,
        })
      }
      if (patch.supplierNotificationEmailBody !== undefined) {
        patches.push({
          path: "SlashSupplierNotificationEmailBody",
          op: "Replace",
          value: patch.supplierNotificationEmailBody,
        })
      }
      if (patch.supplierNotificationEmailBodyIsHtml !== undefined) {
        patches.push({
          path: "SlashSupplierNotificationEmailBodyIsHtml",
          op: "Replace",
          value: patch.supplierNotificationEmailBodyIsHtml,
        })
      }
      if (patch.supplierNotificationEmailLabels !== undefined) {
        patches.push({
          path: "SlashSupplierNotificationEmailLabels",
          op: "Replace",
          value: patch.supplierNotificationEmailLabels,
        })
      }
      if (patches.length === 0) return

      setSupplierEmailTemplateSaveError(null)
      patchCurrentUser.mutate(
        {
          userId: currentUser.id,
          patches,
        },
        {
          onSuccess: () => setSupplierEmailTemplateSaveError(null),
          onError: (error) => {
            void extractErrorMessage(error).then(setSupplierEmailTemplateSaveError)
          },
        },
      )
    },
    [currentUser?.id, patchCurrentUser],
  )

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Typography
          as="h2"
          variant="display-md"
          weight="semibold"
          className="mb-4"
        >
          {tProductModels("ordersEmail.label")}
        </Typography>
        <div className="space-y-2">
          <Input
            id="admin-orders-email-input"
            value={ordersRecipientEmail}
            onChange={(e) => setOrdersRecipientEmail(e.target.value)}
            placeholder={tProductModels("ordersEmail.placeholder")}
            className={!isOrdersEmailValid ? "border-destructive" : undefined}
            disabled={patchCurrentUser.isPending || !currentUser?.id}
          />
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {tProductModels("ordersEmail.hint")}
          </Typography>
          {!isOrdersEmailValid && (
            <Typography
              as="p"
              variant="body-sm"
              className="text-destructive"
            >
              {tProductModels("ordersEmail.invalid")}
            </Typography>
          )}
          {ordersEmailSaveError && (
            <Typography
              as="p"
              variant="body-sm"
              className="text-destructive"
            >
              {ordersEmailSaveError}
            </Typography>
          )}
          {hasOrdersEmailChanged && (
            <Button
              size="sm"
              onClick={handleSaveOrdersEmail}
              disabled={patchCurrentUser.isPending || !isOrdersEmailValid || !currentUser?.id}
            >
              {patchCurrentUser.isPending
                ? tProductModels("ordersEmail.saving")
                : tProductModels("ordersEmail.save")}
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <Typography
          as="h2"
          variant="display-md"
          weight="semibold"
          className="mb-4"
        >
          {t("emailTemplateTitle")}
        </Typography>
        <Typography
          as="p"
          variant="body-sm"
          className="mb-6 text-muted-foreground"
        >
          {t("emailTemplateDescription")}
        </Typography>

        <div className="mb-4 flex gap-1 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveEmailTab("customer")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeEmailTab === "customer"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("emailTabCustomer")}
          </button>
          <button
            type="button"
            onClick={() => setActiveEmailTab("supplier")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeEmailTab === "supplier"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("emailTabSupplier")}
          </button>
        </div>

        {activeEmailTab === "customer" && (
          <QuoteRequestEmailTemplateConfig
            preset={currentUser?.quoteRequestEmailTemplatePreset ?? null}
            subject={currentUser?.quoteRequestEmailSubject ?? null}
            body={currentUser?.quoteRequestEmailBody ?? null}
            bodyIsHtml={currentUser?.quoteRequestEmailBodyIsHtml ?? false}
            labels={currentUser?.quoteRequestEmailLabels ?? null}
            onSave={handleSaveEmailTemplate}
            isPending={patchCurrentUser.isPending}
            saveError={emailTemplateSaveError}
          />
        )}
        {activeEmailTab === "supplier" && (
          <SupplierNotificationEmailTemplateConfig
            preset={currentUser?.supplierNotificationEmailTemplatePreset ?? null}
            subject={currentUser?.supplierNotificationEmailSubject ?? null}
            body={currentUser?.supplierNotificationEmailBody ?? null}
            bodyIsHtml={currentUser?.supplierNotificationEmailBodyIsHtml ?? false}
            labels={currentUser?.supplierNotificationEmailLabels ?? null}
            onSave={handleSaveSupplierEmailTemplate}
            isPending={patchCurrentUser.isPending}
            saveError={supplierEmailTemplateSaveError}
          />
        )}
      </Card>
    </div>
  )
}
