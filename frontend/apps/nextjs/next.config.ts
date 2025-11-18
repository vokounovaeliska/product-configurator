/* eslint-disable */
import type {NextConfig} from "next"
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig = {
    transpilePackages: ["@workspace/ui"],
    images: {remotePatterns: [{protocol: "http", hostname: "minio"}]},
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
