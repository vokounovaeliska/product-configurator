/**
 * A shared basic Prettier configuration for the repository.
 *
 * @type {import('prettier').Config}
 **/
const baseConfig = {
  printWidth: 100,
  semi: false,
  trailingComma: "all",
  singleAttributePerLine: true,
  endOfLine: "lf",
};

export default baseConfig;
