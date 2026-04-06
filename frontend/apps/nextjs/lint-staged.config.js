export default {
  "src/**/*.{ts,tsx,css}": ["pnpm exec prettier --write"],
  "src/**/*.{ts,tsx,js,cjs,mjs}": ["pnpm exec eslint --fix"],
  // e.g. plugin .rbz under public/ — otherwise lint-staged warns when nothing in src/ is staged.
  "public/**/*": () => "true",
}
