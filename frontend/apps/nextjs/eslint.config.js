import { nextJsConfig } from "@workspace/eslint-config/next-js"

/** @type {import("eslint").Linter.Config} */
const config = [
  ...nextJsConfig,
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
