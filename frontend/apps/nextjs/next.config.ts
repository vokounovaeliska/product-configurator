/* eslint-disable */
import path from "path"
import { fileURLToPath } from "url"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const restApiUrl = process.env.NEXT_PUBLIC_REST_API_URL
const restHost = restApiUrl ? new URL(restApiUrl).hostname : null
const restPatterns =
  restHost && !["localhost", "127.0.0.1"].includes(restHost)
    ? [
        { protocol: "http" as const, hostname: restHost },
        { protocol: "https" as const, hostname: restHost },
      ]
    : []

const nextConfig = {
    outputFileTracingRoot: path.resolve(__dirname, "../../.."),
    transpilePackages: ["@workspace/ui"],
    images: {
      remotePatterns: [
        { protocol: "http", hostname: "minio" },
        { protocol: "https", hostname: "minio" },
        { protocol: "http", hostname: "localhost" },
        { protocol: "https", hostname: "localhost" },
        { protocol: "http", hostname: "127.0.0.1" },
        { protocol: "https", hostname: "127.0.0.1" },
        ...restPatterns,
      ],
    },
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
                resourceQuery: {not: [...fileLoaderRule.resourceQuery.not, /url/]}, // exclude if *.svg?url
                use: ["@svgr/webpack"],
            },
        )

        // Modify the file loader rule to ignore *.svg, since we have it handled now.
        fileLoaderRule.exclude = /\.svg$/i

        return config
    },
} satisfies NextConfig

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts")

export default withNextIntl(nextConfig)
