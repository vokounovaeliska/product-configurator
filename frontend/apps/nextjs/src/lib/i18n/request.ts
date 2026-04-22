import { hasLocale } from "next-intl"
import { getRequestConfig } from "next-intl/server"

import { routing } from "./routing"

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".")
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === "string" ? current : undefined
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  const messagesModule = (await import(`../../../locales/${locale}.json`)) as {
    default: Record<string, unknown>
  }
  const messages: Record<string, unknown> = messagesModule.default
  const fallbackMessages =
    locale !== routing.defaultLocale
      ? (
          (await import(`../../../locales/${routing.defaultLocale}.json`)) as {
            default: Record<string, unknown>
          }
        ).default
      : null

  return {
    locale,
    messages,
    getMessageFallback({ namespace, key }) {
      if (key == null) return namespace ?? ""
      const fullPath = [namespace, key].filter(Boolean).join(".")
      const fromDefault =
        fallbackMessages != null ? getNested(fallbackMessages, fullPath) : undefined
      return fromDefault ?? key
    },
  }
})
