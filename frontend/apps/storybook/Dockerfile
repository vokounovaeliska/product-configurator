# Base image with essential tools
FROM node:22-alpine AS base

# Install necessary packages and setup pnpm
RUN apk add --no-cache libc6-compat && \
    npm install -g corepack && \
    corepack enable && \
    corepack enable pnpm

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Builder stage for pruning dependencies
FROM base AS builder

WORKDIR /app

# Install TurboRepo globally
RUN pnpm add -g turbo

# Copy source code and prune dependencies for Storybook
COPY . .
# nextjs app also includes stories
RUN turbo prune --scope=storybook --scope=nextjs --docker 


# Installer stage for installing and building the app
FROM base AS installer

WORKDIR /app

# Copy pruned dependencies and install them
COPY --from=builder /app/out/json/ .
RUN pnpm install

# Copy full source and build the app
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=storybook

# Final stage
FROM base AS final

WORKDIR /app

# Copy built output and production deps
COPY --from=installer /app ./
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/package.json ./package.json
COPY --from=installer /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Expose the port Storybook runs on
EXPOSE 3003

# Start the app
CMD ["pnpm", "turbo", "start", "--filter=storybook"]