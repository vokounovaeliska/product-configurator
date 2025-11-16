import type { MetadataRoute } from "next"

import { env } from "@/config/env"

// disallow crawling for non-production environments
const rules =
  env.ENV_NAME === "production"
    ? {
        userAgent: "*",
        allow: "/",
      }
    : {
        userAgent: "*",
        disallow: "/",
      }

export default function robots(): MetadataRoute.Robots {
  return {
    rules,
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  }
}
