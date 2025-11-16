import { createRestrictedPathsPlugin } from "./lib/createRestrictedPaths.js";

const createRestrictedPaths = createRestrictedPathsPlugin("./src/features");

/**
 * Import eslint rules - rules from the eslint-plugin-import plugin
 * @type {import("eslint").Linter.Config.RulesRecord}
 */
export const importRules = {
  "import/no-unresolved": "error",
  "import/no-cycle": "error",
  "import/no-restricted-paths": [
    "error",
    {
      zones: [
        // Enforce unidirectional codebase:
        ...createRestrictedPaths(),
        // e.g. src/app can import from src/features but not the other way around
        {
          target: "./src/features",
          from: ["./src/app", "./src/routes"],
          except: ["./routes.ts"],
        },

        // e.g src/features and src/app can import from these shared modules but not the other way around
        {
          target: [
            "./src/api",
            "./src/assets",
            "./src/components",
            "./src/config",
            "./src/hooks",
            "./src/lib",
            "./src/schemas",
            "./src/types",
            "./src/utils",
          ],
          from: ["./src/features", "./src/app"],
          except: ["./routes.ts"],
        },
      ],
    },
  ],
};
