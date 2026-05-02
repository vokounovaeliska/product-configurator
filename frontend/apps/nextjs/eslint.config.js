import path from "node:path"
import { fileURLToPath } from "node:url"

import { nextJsConfig } from "@workspace/eslint-config/next-js"

const appDir = path.dirname(fileURLToPath(import.meta.url))
const tsconfigPath = path.join(appDir, "tsconfig.json")

/** @type {import("eslint").Linter.Config} */
const config = [
  ...nextJsConfig,
  {
    languageOptions: {
      parserOptions: {
        project: [tsconfigPath],
        tsconfigRootDir: appDir,
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: tsconfigPath,
        },
      },
    },
  },
  {
    rules: {
      // Consistently import navigation APIs from `@/src/i18n/routing`
      "no-restricted-imports": [
        "error",
        {
          name: "next/link",
          message: "Please import from `@/i18n/routing` instead.",
        },
        {
          name: "next/navigation",
          importNames: ["redirect", "permanentRedirect", "useRouter", "usePathname"],
          message: "Please import from `@/i18n/routing` instead.",
        },
      ],
    },
  },
]

export default config
