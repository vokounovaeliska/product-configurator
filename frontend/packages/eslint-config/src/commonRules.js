/**
 * Common eslint rules - built into eslint without any plugin required
 * @type {import("eslint").Linter.Config.RulesRecord}
 */
export const commonRules = {
  "no-console": ["warn", { allow: ["warn", "error"] }],
  "no-restricted-syntax": [
    "error",
    {
      selector:
        "UnaryExpression[operator='!'][argument.type='UnaryExpression'][argument.operator='!']",
      message: "Don't use double negation (!!). Use Boolean() instead.",
    },
  ],
  curly: ["error", "multi-line"],
  "no-restricted-imports": [
    "error",
    {
      paths: [
        {
          name: "react",
          importNames: ["default"],
          message:
            "Default React import is not necessary for JSX to work. Use named imports (e.g. `import { useEffect } from 'react'`) (https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html).",
        },
      ],
      patterns: [
        {
          group: ["..*"],
          message:
            "Avoid using relative imports except sibling files. Use absolute imports instead.",
        },
      ],
    },
  ],
};
