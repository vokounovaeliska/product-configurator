export default {
  "src/**/*.{ts,tsx,css}": ["pnpm exec prettier --write"],
  "src/**/*.{ts,tsx,js,cjs,mjs}": ["pnpm exec eslint --fix"],
}
