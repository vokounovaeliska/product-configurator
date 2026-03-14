import type { operations } from "@/api/types"

// Auth
export type LoginRequest = operations["userAuthLogin"]["requestBody"]["content"]["application/json"]

export type LoginResponse = operations["userAuthLogin"]["responses"]["200"]["content"]["*/*"]

export type RegistrationRequest =
  operations["userRegistration"]["requestBody"]["content"]["application/json"]

export type RegistrationResponse =
  operations["userRegistration"]["responses"]["200"]["content"]["*/*"]

// Users
type UserDtoFromApi = operations["usersGet"]["responses"]["200"]["content"]["*/*"]
export type UserDto = UserDtoFromApi & {
  notificationEmail?: string | null
  quoteRequestEmailTemplatePreset?: string | null
  quoteRequestEmailSubject?: string | null
  quoteRequestEmailBody?: string | null
  quoteRequestEmailBodyIsHtml?: boolean
  quoteRequestEmailLabels?: Record<string, string> | null
  supplierNotificationEmailTemplatePreset?: string | null
  supplierNotificationEmailSubject?: string | null
  supplierNotificationEmailBody?: string | null
  supplierNotificationEmailBodyIsHtml?: boolean
  supplierNotificationEmailLabels?: Record<string, string> | null
}

type UserMeDtoFromApi = operations["usersMe"]["responses"]["200"]["content"]["*/*"]
export type UserMeDto = UserMeDtoFromApi & {
  notificationEmail?: string | null
  quoteRequestEmailTemplatePreset?: string | null
  quoteRequestEmailSubject?: string | null
  quoteRequestEmailBody?: string | null
  quoteRequestEmailBodyIsHtml?: boolean
  quoteRequestEmailLabels?: Record<string, string> | null
  supplierNotificationEmailTemplatePreset?: string | null
  supplierNotificationEmailSubject?: string | null
  supplierNotificationEmailBody?: string | null
  supplierNotificationEmailBodyIsHtml?: boolean
  supplierNotificationEmailLabels?: Record<string, string> | null
}

type UserPatchRequestDtoFromApi =
  operations["usersPatch"]["requestBody"]["content"]["application/json"][number]

type NotificationEmailPatch = {
  path: "SlashNotificationEmail"
  op: "Replace"
  value: string | null
}

type QuoteRequestEmailTemplatePatch = {
  path:
    | "SlashQuoteRequestEmailTemplatePreset"
    | "SlashQuoteRequestEmailSubject"
    | "SlashQuoteRequestEmailBody"
    | "SlashQuoteRequestEmailBodyIsHtml"
    | "SlashQuoteRequestEmailLabels"
  op: "Replace"
  value: string | null | boolean | Record<string, string>
}

type SupplierNotificationEmailTemplatePatch = {
  path:
    | "SlashSupplierNotificationEmailTemplatePreset"
    | "SlashSupplierNotificationEmailSubject"
    | "SlashSupplierNotificationEmailBody"
    | "SlashSupplierNotificationEmailBodyIsHtml"
    | "SlashSupplierNotificationEmailLabels"
  op: "Replace"
  value: string | null | boolean | Record<string, string>
}

export type UserPatchRequestDto =
  | UserPatchRequestDtoFromApi
  | NotificationEmailPatch
  | QuoteRequestEmailTemplatePatch
  | SupplierNotificationEmailTemplatePatch
