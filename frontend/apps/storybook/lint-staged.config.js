export default {
  "{src,.storybook}/**/*.{ts,tsx}": [
    "pnpm exec prettier --write",
    "pnpm exec eslint --fix",
  ],
}
