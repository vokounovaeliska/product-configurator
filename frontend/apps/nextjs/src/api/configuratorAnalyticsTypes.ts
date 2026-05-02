export type ConfiguratorAnalyticsSurface = "EMBED_IFRAME" | "PUBLIC_CONFIGURATOR_PAGE"

export type ConfiguratorAnalyticsClientEventType =
  | "CONFIGURATOR_OPEN"
  | "CONFIGURATION_CHANGE"
  | "REQUEST_FORM_OPEN"

export type ConfiguratorAnalyticsEmbedContext = {
  surface: "EMBED_IFRAME"
  embedOwnerUserId: string
  embedProductUrl: string
}

export type ConfiguratorAnalyticsPublicContext = {
  surface: "PUBLIC_CONFIGURATOR_PAGE"
}

export type ConfiguratorAnalyticsExecutionContext =
  | ConfiguratorAnalyticsEmbedContext
  | ConfiguratorAnalyticsPublicContext

export const CONFIGURATOR_ANALYTICS_SESSION_STORAGE_KEY = "configurator_analytics_session_v1"
