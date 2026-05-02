import type {
  ConfiguratorAnalyticsClientEventType,
  ConfiguratorAnalyticsExecutionContext,
} from "@/api/configuratorAnalyticsTypes"
import { publicApi } from "@/lib/api/restClient"

export type ConfiguratorAnalyticsClientEvent = {
  type: ConfiguratorAnalyticsClientEventType
  sessionId: string
  productModelId: string
  surface: ConfiguratorAnalyticsExecutionContext["surface"]
  embedOwnerUserId?: string
  embedProductUrl?: string
}

export async function sendConfiguratorAnalyticsEvents(events: ConfiguratorAnalyticsClientEvent[]) {
  if (events.length === 0) return
  try {
    await publicApi.post("embed/api/v1/configurator-analytics/events", {
      json: { events },
    })
  } catch {
    /* best-effort first-party analytics */
  }
}

export function buildClientEventPayload(
  productModelId: string,
  type: ConfiguratorAnalyticsClientEventType,
  sessionId: string,
  ctx: ConfiguratorAnalyticsExecutionContext,
): ConfiguratorAnalyticsClientEvent {
  if (ctx.surface === "EMBED_IFRAME") {
    return {
      type,
      sessionId,
      productModelId,
      surface: ctx.surface,
      embedOwnerUserId: ctx.embedOwnerUserId,
      embedProductUrl: ctx.embedProductUrl,
    }
  }
  return {
    type,
    sessionId,
    productModelId,
    surface: ctx.surface,
  }
}
