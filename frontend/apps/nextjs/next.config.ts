/* eslint-disable */
import { fileURLToPath } from "url"
import { dirname, resolve } from "path"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  images: { remotePatterns: [{ protocol: "http", hostname: "minio" }] },
  webpack(config) {
    // Grab the existing rule that handles SVG imports
    // @ts-expect-error
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.(".svg"))

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      },
    )

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i

    return config
  },
} satisfies NextConfig

// Use absolute path to ensure it works in all environments (local, CI, etc.)
const i18nConfigPath = resolve(__dirname, "src/lib/i18n/request.ts")
const withNextIntl = createNextIntlPlugin(i18nConfigPath)

export default withNextIntl(nextConfig)
