/**
 * Common eslint rules for TypeScript
 * @type {import("eslint").Linter.Config.RulesRecord}
 */
export const typescriptRules = {
  "@typescript-eslint/consistent-type-definitions": ["error", "type"],
  "@typescript-eslint/no-misused-promises": [
    2,
    {
      checksVoidReturn: {
        attributes: false,
      },
    },
  ],
  "@typescript-eslint/consistent-type-imports": [
    "warn",
    {
      fixStyle: "inline-type-imports",
    },
  ],
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
    },
  ],
  "@typescript-eslint/naming-convention": [
    "error",
    {
      selector: "variable",
      types: ["boolean"],
      format: ["PascalCase"],
      prefix: ["is", "should", "has", "can", "did", "will", "does"],
    },
    {
      selector: "parameter",
      types: ["boolean"],
      format: ["PascalCase"],
      prefix: ["is", "should", "has", "can", "did", "will", "does"],
      filter: {
        regex: "^(asChild|prev|required)$",
        match: false,
      },
    },
  ],
  "@typescript-eslint/only-throw-error": "off",
};
