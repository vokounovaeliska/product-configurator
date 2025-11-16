import baseConfig from "./base.js";

/**
 * An extended version of base config.
 * Includes import sorting, tailwind plugin and json sort
 *
 * @type {import('prettier').Config}
 **/
const reactConfig = {
  ...baseConfig,
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-sort-json",
    "prettier-plugin-tailwindcss",
  ],
  importOrder: [
    "^(react/(.*)$)|^(react$)",
    "<THIRD_PARTY_MODULES>",
    "^@workspace/(.*)$",
    "",
    "^@/(?!features/)(.*)$", // Everything from @/ except features
    "",
    "^@/features/(.*)$", // Everything from @/features
    "",
    "^[./]",
  ],
  jsonRecursiveSort: true,
  tailwindFunctions: ["cva", "cn"],
  tailwindStylesheet: "../../packages/ui/src/styles/globals.css",
  overrides: [
    {
      files: "*.svg",
      options: {
        parser: "html",
      },
    },
    {
      files: "tsconfig*.json",
      options: {
        jsonRecursiveSort: false,
      },
    },
  ],
};

export default reactConfig;
