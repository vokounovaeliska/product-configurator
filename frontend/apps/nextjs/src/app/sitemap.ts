import type { MetadataRoute } from "next"

import { env } from "@/config/env"
import { routing } from "@/lib/i18n/routing"
import { ROUTES } from "@/lib/routes"

const getEntries = (path: string) =>
  routing.locales.map((locale) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}/${locale}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === ROUTES.home ? 1 : 0.8,
  }))

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...getEntries(ROUTES.home),
    ...getEntries(ROUTES.login),
    ...getEntries(ROUTES.registration),
    ...getEntries(ROUTES.tutorial),
    ...getEntries(ROUTES.privacy),
    ...getEntries(ROUTES.cookies),
  ]
}
