# ESLint Config

Shared ESLint configuration for the monorepo.

## Installation

```bash
pnpm add -D @workspace/eslint-config
```

## Usage

Create an `eslint.config.js` file:

```js
import config from "@workspace/eslint-config";

export default config;
```

## Features

- 🎯 TypeScript support
- 🎨 React support
- 📝 Import sorting
- 🔍 Unused imports
- 🎯 Type checking
- 📦 Module resolution
- 🎨 Code style
- 🔍 Best practices

## Available Configurations

### Base Configuration

```js
import baseConfig from "@workspace/eslint-config";

export default baseConfig;
```

### Next.js Configuration

```js
import nextConfig from "@workspace/eslint-config/nextjs";

export default nextConfig;
```

### React Library Configuration

```js
import reactLibraryConfig from "@workspace/eslint-config/react-library";

export default reactLibraryConfig;
```
