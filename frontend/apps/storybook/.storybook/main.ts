import { createRequire } from "module"
import { dirname, join } from "path"
import type { StorybookConfig } from "@storybook/react-vite"
import type { UserConfig } from "vite"
import viteTsconfigPaths from "vite-tsconfig-paths"

const require = createRequire(import.meta.url)

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, "package.json")))
}

const config: StorybookConfig = {
  stories: ["../docs/**/*.mdx", "../../../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-themes"),
    getAbsolutePath("@storybook/addon-a11y"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  core: {
    disableTelemetry: true,
  },
  typescript: {
    reactDocgen: "react-docgen",
  },
  viteFinal: async (config: UserConfig) => {
    return {
      ...config,
      define: {
        "process.env": {},
      },
      optimizeDeps: {
        ...config.optimizeDeps,
        include: [
          ...(config.optimizeDeps?.include
            ? ([] as string[]).concat(config.optimizeDeps.include)
            : []),
          "react-dom/client",
          "react-dom/test-utils",
        ],
      },
      esbuild: {
        jsxInject: `import React from 'react'`,
      },
      plugins: [
        ...(config.plugins || []),
        viteTsconfigPaths(),
        {
          name: "remove-use-client",
          transform(code: string) {
            if (code.includes("use client")) {
              return code.replace(/"use client"/, "")
            }
          },
        },
      ],
    }
  },
}

export default config
