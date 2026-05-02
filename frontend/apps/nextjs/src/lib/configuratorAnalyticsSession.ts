import { CONFIGURATOR_ANALYTICS_SESSION_STORAGE_KEY } from "@/api/configuratorAnalyticsTypes"

export function getOrCreateConfiguratorAnalyticsSessionId(): string {
  if (typeof window === "undefined") return ""
  try {
    let id = sessionStorage.getItem(CONFIGURATOR_ANALYTICS_SESSION_STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(CONFIGURATOR_ANALYTICS_SESSION_STORAGE_KEY, id)
    }
    return id
  } catch {
    return ""
  }
}
